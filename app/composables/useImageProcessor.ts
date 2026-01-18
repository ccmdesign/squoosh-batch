import type { QueuedImage, CompressionSettings, OutputFormat } from '~/types'

// Lazy-loaded codec imports
let codecs: {
  decodeJpeg: typeof import('@jsquash/jpeg').decode
  encodeJpeg: typeof import('@jsquash/jpeg').encode
  decodePng: typeof import('@jsquash/png').decode
  encodePng: typeof import('@jsquash/png').encode
  optimisePng: typeof import('@jsquash/oxipng').optimise
  decodeWebp: typeof import('@jsquash/webp').decode
  encodeWebp: typeof import('@jsquash/webp').encode
  encodeAvif: typeof import('@jsquash/avif').encode
  resize: typeof import('@jsquash/resize').default
} | null = null

async function loadCodecs() {
  if (codecs) return codecs

  const [jpeg, png, oxipng, webp, avif, resizeModule] = await Promise.all([
    import('@jsquash/jpeg'),
    import('@jsquash/png'),
    import('@jsquash/oxipng'),
    import('@jsquash/webp'),
    import('@jsquash/avif'),
    import('@jsquash/resize')
  ])

  codecs = {
    decodeJpeg: jpeg.decode,
    encodeJpeg: jpeg.encode,
    decodePng: png.decode,
    encodePng: png.encode,
    optimisePng: oxipng.optimise,
    decodeWebp: webp.decode,
    encodeWebp: webp.encode,
    encodeAvif: avif.encode,
    resize: resizeModule.default
  }

  return codecs
}

export function useImageProcessor() {
  const isProcessing = ref(false)
  const currentImageId = ref<string | null>(null)

  async function processImage(
    image: QueuedImage,
    settings: CompressionSettings,
    onProgress: (percent: number) => void
  ): Promise<Blob> {
    const c = await loadCodecs()

    onProgress(10)

    // Step 1: Read file as ArrayBuffer
    const buffer = await image.file.arrayBuffer()
    onProgress(20)

    // Step 2: Decode the image
    let imageData = await decodeImage(c, buffer, image.file.type)
    onProgress(40)

    // Step 3: Resize if needed
    if (settings.resizeMode !== 'none' && settings.resizeValue > 0) {
      imageData = await resizeImage(c, imageData, settings)
    }
    onProgress(60)

    // Step 4: Encode to target format
    const { buffer: result, mimeType } = await encodeImage(
      c,
      imageData,
      settings.outputFormat,
      settings.quality,
      image.file.type
    )
    onProgress(90)

    return new Blob([result], { type: mimeType })
  }

  async function processQueue(
    images: readonly QueuedImage[],
    settings: CompressionSettings,
    callbacks: {
      onStart: (id: string) => void
      onProgress: (id: string, percent: number) => void
      onComplete: (id: string, blob: Blob) => void
      onError: (id: string, error: string) => void
    }
  ) {
    if (isProcessing.value) {
      console.warn('Already processing')
      return
    }

    isProcessing.value = true

    // Pre-load codecs
    await loadCodecs()

    const pendingImages = images.filter(img => img.status === 'pending')

    for (const image of pendingImages) {
      currentImageId.value = image.id
      callbacks.onStart(image.id)

      try {
        const blob = await processImage(
          image,
          settings,
          (percent) => callbacks.onProgress(image.id, percent)
        )
        callbacks.onComplete(image.id, blob)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        callbacks.onError(image.id, message)
      }
    }

    isProcessing.value = false
    currentImageId.value = null
  }

  return {
    isProcessing: readonly(isProcessing),
    currentImageId: readonly(currentImageId),
    processImage,
    processQueue
  }
}

// Helper functions
async function decodeImage(
  c: NonNullable<typeof codecs>,
  buffer: ArrayBuffer,
  mimeType: string
): Promise<ImageData> {
  switch (mimeType) {
    case 'image/jpeg':
      return await c.decodeJpeg(buffer)
    case 'image/png':
      return await c.decodePng(buffer)
    case 'image/webp':
      return await c.decodeWebp(buffer)
    default:
      // Try to detect format from magic bytes
      const detected = detectFormat(buffer)
      if (detected) {
        return decodeImage(c, buffer, detected)
      }
      throw new Error(`Unsupported image format: ${mimeType}`)
  }
}

function detectFormat(buffer: ArrayBuffer): string | null {
  const arr = new Uint8Array(buffer.slice(0, 12))

  if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
    return 'image/jpeg'
  }
  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
    return 'image/png'
  }
  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 &&
      arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) {
    return 'image/webp'
  }

  return null
}

async function resizeImage(
  c: NonNullable<typeof codecs>,
  imageData: ImageData,
  settings: CompressionSettings
): Promise<ImageData> {
  const { resizeMode, resizeValue } = settings
  const { width: originalWidth, height: originalHeight } = imageData

  let newWidth: number
  let newHeight: number

  switch (resizeMode) {
    case 'width':
      newWidth = resizeValue
      newHeight = Math.round((originalHeight / originalWidth) * resizeValue)
      break
    case 'height':
      newHeight = resizeValue
      newWidth = Math.round((originalWidth / originalHeight) * resizeValue)
      break
    case 'max-dimension':
      if (originalWidth >= originalHeight) {
        newWidth = resizeValue
        newHeight = Math.round((originalHeight / originalWidth) * resizeValue)
      } else {
        newHeight = resizeValue
        newWidth = Math.round((originalWidth / originalHeight) * resizeValue)
      }
      break
    default:
      return imageData
  }

  // Don't upscale
  if (newWidth >= originalWidth && newHeight >= originalHeight) {
    return imageData
  }

  newWidth = Math.max(1, newWidth)
  newHeight = Math.max(1, newHeight)

  return await c.resize(imageData, {
    width: newWidth,
    height: newHeight
  })
}

async function encodeImage(
  c: NonNullable<typeof codecs>,
  imageData: ImageData,
  format: OutputFormat,
  quality: number,
  originalMimeType: string
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  const targetFormat = format === 'original'
    ? getFormatFromMimeType(originalMimeType)
    : format

  switch (targetFormat) {
    case 'jpeg':
      return {
        buffer: await c.encodeJpeg(imageData, { quality }),
        mimeType: 'image/jpeg'
      }
    case 'webp':
      return {
        buffer: await c.encodeWebp(imageData, { quality }),
        mimeType: 'image/webp'
      }
    case 'avif':
      return {
        buffer: await c.encodeAvif(imageData, { quality }),
        mimeType: 'image/avif'
      }
    case 'png':
      const pngBuffer = await c.encodePng(imageData)
      const optimized = await c.optimisePng(pngBuffer, { level: quality })
      return {
        buffer: optimized,
        mimeType: 'image/png'
      }
    default:
      return {
        buffer: await c.encodeWebp(imageData, { quality: 80 }),
        mimeType: 'image/webp'
      }
  }
}

function getFormatFromMimeType(mimeType: string): Exclude<OutputFormat, 'original'> {
  switch (mimeType) {
    case 'image/jpeg': return 'jpeg'
    case 'image/png': return 'png'
    case 'image/webp': return 'webp'
    case 'image/avif': return 'avif'
    default: return 'jpeg'
  }
}
