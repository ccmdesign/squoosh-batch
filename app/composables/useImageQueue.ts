import type { QueuedImage } from '~/types'

export function useImageQueue() {
  const images = ref<QueuedImage[]>([])

  function addImages(files: File[]) {
    const newImages: QueuedImage[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      originalName: file.name,
      originalSize: file.size,
      status: 'pending',
      progress: 0,
      thumbnailUrl: URL.createObjectURL(file)
    }))
    images.value.push(...newImages)
    return newImages
  }

  function removeImage(id: string) {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      const image = images.value[index]
      // Revoke thumbnail URL to free memory
      if (image.thumbnailUrl) {
        URL.revokeObjectURL(image.thumbnailUrl)
      }
      // Revoke processed blob URL if exists
      if (image.processedBlob) {
        URL.revokeObjectURL(URL.createObjectURL(image.processedBlob))
      }
      images.value.splice(index, 1)
    }
  }

  function updateImage(id: string, updates: Partial<QueuedImage>) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      Object.assign(image, updates)
    }
  }

  function setStatus(id: string, status: QueuedImage['status']) {
    updateImage(id, { status })
  }

  function setProgress(id: string, progress: number) {
    updateImage(id, { progress })
  }

  function setCompleted(id: string, blob: Blob) {
    updateImage(id, {
      status: 'completed',
      progress: 100,
      processedBlob: blob,
      processedSize: blob.size
    })
  }

  function setError(id: string, error: string) {
    updateImage(id, {
      status: 'error',
      error
    })
  }

  function clearQueue() {
    // Revoke all URLs
    images.value.forEach(img => {
      if (img.thumbnailUrl) {
        URL.revokeObjectURL(img.thumbnailUrl)
      }
    })
    images.value = []
  }

  function resetQueue() {
    images.value.forEach(img => {
      if (img.status !== 'pending') {
        img.status = 'pending'
        img.progress = 0
        img.processedBlob = undefined
        img.processedSize = undefined
        img.error = undefined
      }
    })
  }

  const pendingImages = computed(() =>
    images.value.filter(img => img.status === 'pending')
  )

  const processingImages = computed(() =>
    images.value.filter(img => img.status === 'processing')
  )

  const completedImages = computed(() =>
    images.value.filter(img => img.status === 'completed')
  )

  const errorImages = computed(() =>
    images.value.filter(img => img.status === 'error')
  )

  const totalOriginalSize = computed(() =>
    images.value.reduce((sum, img) => sum + img.originalSize, 0)
  )

  const totalProcessedSize = computed(() =>
    images.value.reduce((sum, img) => sum + (img.processedSize || 0), 0)
  )

  const totalSavings = computed(() => {
    const completed = completedImages.value
    if (completed.length === 0) return { bytes: 0, percent: 0 }

    const originalTotal = completed.reduce((sum, img) => sum + img.originalSize, 0)
    const processedTotal = completed.reduce((sum, img) => sum + (img.processedSize || 0), 0)
    const savedBytes = originalTotal - processedTotal
    const savedPercent = originalTotal > 0 ? (savedBytes / originalTotal) * 100 : 0

    return {
      bytes: savedBytes,
      percent: savedPercent
    }
  })

  const overallProgress = computed(() => {
    if (images.value.length === 0) return 0
    const total = images.value.reduce((sum, img) => sum + img.progress, 0)
    return total / images.value.length
  })

  const isProcessing = computed(() =>
    images.value.some(img => img.status === 'processing')
  )

  const hasImages = computed(() => images.value.length > 0)

  const hasCompletedImages = computed(() => completedImages.value.length > 0)

  return {
    images: readonly(images),
    addImages,
    removeImage,
    updateImage,
    setStatus,
    setProgress,
    setCompleted,
    setError,
    clearQueue,
    resetQueue,
    pendingImages,
    processingImages,
    completedImages,
    errorImages,
    totalOriginalSize,
    totalProcessedSize,
    totalSavings,
    overallProgress,
    isProcessing,
    hasImages,
    hasCompletedImages
  }
}
