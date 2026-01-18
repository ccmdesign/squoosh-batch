import type { OutputFormat } from '~/types'
import { FORMAT_CONFIGS } from '~/types'

export function useFileNaming() {
  /**
   * Converts a string to kebab-case
   * - Lowercase
   * - Replace spaces and underscores with hyphens
   * - Remove special characters except hyphens and dots
   * - Collapse multiple hyphens
   */
  function toKebabCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\s_]+/g, '-')           // Replace spaces and underscores with hyphens
      .replace(/[^a-z0-9\-\.]/g, '')     // Remove special chars except hyphens and dots
      .replace(/-+/g, '-')               // Collapse multiple hyphens
      .replace(/^-|-$/g, '')             // Remove leading/trailing hyphens
  }

  /**
   * Get the extension for a given output format
   */
  function getExtension(format: OutputFormat, originalMimeType: string): string {
    if (format === 'original') {
      // Determine extension from original mime type
      switch (originalMimeType) {
        case 'image/jpeg':
          return 'jpg'
        case 'image/png':
          return 'png'
        case 'image/webp':
          return 'webp'
        case 'image/avif':
          return 'avif'
        default:
          return 'jpg' // Fallback
      }
    }
    return FORMAT_CONFIGS[format].extension
  }

  /**
   * Generate output filename from original name and format
   * Example: "My Image_2024.PNG" -> "my-image-2024.webp"
   */
  function generateOutputFilename(
    originalName: string,
    format: OutputFormat,
    originalMimeType: string
  ): string {
    // Remove the original extension
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')

    // Convert to kebab-case
    const kebabName = toKebabCase(nameWithoutExt)

    // Get new extension
    const extension = getExtension(format, originalMimeType)

    return `${kebabName}.${extension}`
  }

  /**
   * Format file size for display
   * Example: 1536000 -> "1.5 MB"
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
  }

  /**
   * Format percentage for display
   * Example: 0.4523 -> "45.2%"
   */
  function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`
  }

  return {
    toKebabCase,
    getExtension,
    generateOutputFilename,
    formatFileSize,
    formatPercent
  }
}
