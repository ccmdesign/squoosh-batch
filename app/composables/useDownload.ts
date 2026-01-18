import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { QueuedImage, OutputFormat } from '~/types'

export function useDownload() {
  const { generateOutputFilename } = useFileNaming()
  const isDownloading = ref(false)

  /**
   * Download a single processed image
   */
  function downloadSingle(
    image: QueuedImage,
    outputFormat: OutputFormat
  ) {
    if (!image.processedBlob) {
      console.error('No processed blob available for download')
      return
    }

    const filename = generateOutputFilename(
      image.originalName,
      outputFormat,
      image.file.type
    )

    saveAs(image.processedBlob, filename)
  }

  /**
   * Download all processed images as a ZIP file
   */
  async function downloadAsZip(
    images: QueuedImage[],
    outputFormat: OutputFormat
  ) {
    const completedImages = images.filter(
      img => img.status === 'completed' && img.processedBlob
    )

    if (completedImages.length === 0) {
      console.error('No completed images to download')
      return
    }

    isDownloading.value = true

    try {
      const zip = new JSZip()

      // Track filenames to avoid duplicates
      const usedFilenames = new Set<string>()

      for (const image of completedImages) {
        let filename = generateOutputFilename(
          image.originalName,
          outputFormat,
          image.file.type
        )

        // Handle duplicate filenames by adding a number suffix
        if (usedFilenames.has(filename)) {
          const ext = filename.split('.').pop() || ''
          const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
          let counter = 1

          while (usedFilenames.has(filename)) {
            filename = `${nameWithoutExt}-${counter}.${ext}`
            counter++
          }
        }

        usedFilenames.add(filename)
        zip.file(filename, image.processedBlob!)
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE' // No compression since images are already compressed
      })

      const timestamp = new Date().toISOString().slice(0, 10)
      saveAs(zipBlob, `optimized-images-${timestamp}.zip`)
    } catch (error) {
      console.error('Failed to create ZIP:', error)
      throw error
    } finally {
      isDownloading.value = false
    }
  }

  return {
    downloadSingle,
    downloadAsZip,
    isDownloading: readonly(isDownloading)
  }
}
