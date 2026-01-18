export interface QueuedImage {
  id: string
  file: File
  originalName: string
  originalSize: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  processedBlob?: Blob
  processedSize?: number
  error?: string
  thumbnailUrl?: string
}

export type OutputFormat = 'original' | 'webp' | 'avif' | 'jpeg' | 'png'

export type ResizeMode = 'none' | 'width' | 'height' | 'max-dimension'

export interface CompressionSettings {
  outputFormat: OutputFormat
  quality: number
  resizeMode: ResizeMode
  resizeValue: number
}

export interface FormatConfig {
  label: string
  extension: string
  mimeType: string
  qualityRange: { min: number; max: number }
  qualityDefault: number
  qualityLabel: string
}

export const FORMAT_CONFIGS: Record<Exclude<OutputFormat, 'original'>, FormatConfig> = {
  jpeg: {
    label: 'JPEG',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    qualityRange: { min: 0, max: 100 },
    qualityDefault: 80,
    qualityLabel: 'Quality'
  },
  webp: {
    label: 'WebP',
    extension: 'webp',
    mimeType: 'image/webp',
    qualityRange: { min: 0, max: 100 },
    qualityDefault: 80,
    qualityLabel: 'Quality'
  },
  avif: {
    label: 'AVIF',
    extension: 'avif',
    mimeType: 'image/avif',
    qualityRange: { min: 0, max: 62 },
    qualityDefault: 50,
    qualityLabel: 'Quality'
  },
  png: {
    label: 'PNG',
    extension: 'png',
    mimeType: 'image/png',
    qualityRange: { min: 1, max: 6 },
    qualityDefault: 4,
    qualityLabel: 'Compression Level'
  }
}

export interface ProcessingMessage {
  type: 'process'
  id: string
  imageBuffer: ArrayBuffer
  mimeType: string
  settings: CompressionSettings
}

export interface ProgressMessage {
  type: 'progress'
  id: string
  percent: number
}

export interface CompleteMessage {
  type: 'complete'
  id: string
  result: ArrayBuffer
  mimeType: string
}

export interface ErrorMessage {
  type: 'error'
  id: string
  message: string
}

export type WorkerMessage = ProgressMessage | CompleteMessage | ErrorMessage
