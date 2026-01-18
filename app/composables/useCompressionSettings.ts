import type { CompressionSettings, OutputFormat, ResizeMode } from '~/types'
import { FORMAT_CONFIGS } from '~/types'

const STORAGE_KEY = 'squoosh-batch-settings'

export function useCompressionSettings() {
  const settings = ref<CompressionSettings>({
    outputFormat: 'webp',
    quality: 80,
    resizeMode: 'none',
    resizeValue: 1920
  })

  // Load settings from localStorage on mount
  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        settings.value = { ...settings.value, ...parsed }
      } catch {
        // Ignore parse errors
      }
    }
  })

  // Save settings to localStorage when changed
  watch(settings, (newSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  }, { deep: true })

  function setOutputFormat(format: OutputFormat) {
    settings.value.outputFormat = format
    // Update quality to format default when changing formats
    if (format !== 'original') {
      settings.value.quality = FORMAT_CONFIGS[format].qualityDefault
    }
  }

  function setQuality(quality: number) {
    settings.value.quality = quality
  }

  function setResizeMode(mode: ResizeMode) {
    settings.value.resizeMode = mode
  }

  function setResizeValue(value: number) {
    settings.value.resizeValue = Math.max(1, Math.min(10000, value))
  }

  function resetToDefaults() {
    settings.value = {
      outputFormat: 'webp',
      quality: 80,
      resizeMode: 'none',
      resizeValue: 1920
    }
  }

  const currentFormatConfig = computed(() => {
    if (settings.value.outputFormat === 'original') return null
    return FORMAT_CONFIGS[settings.value.outputFormat]
  })

  const qualityLabel = computed(() => {
    if (!currentFormatConfig.value) return 'Quality'
    return currentFormatConfig.value.qualityLabel
  })

  const qualityRange = computed(() => {
    if (!currentFormatConfig.value) return { min: 0, max: 100 }
    return currentFormatConfig.value.qualityRange
  })

  const shouldShowQuality = computed(() =>
    settings.value.outputFormat !== 'original'
  )

  const shouldShowResize = computed(() =>
    settings.value.resizeMode !== 'none'
  )

  return {
    settings: readonly(settings),
    setOutputFormat,
    setQuality,
    setResizeMode,
    setResizeValue,
    resetToDefaults,
    currentFormatConfig,
    qualityLabel,
    qualityRange,
    shouldShowQuality,
    shouldShowResize
  }
}
