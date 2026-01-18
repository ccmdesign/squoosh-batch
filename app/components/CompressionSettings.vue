<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import type { OutputFormat, ResizeMode } from '~/types'
import { FORMAT_CONFIGS } from '~/types'

const props = defineProps<{
  outputFormat: OutputFormat
  quality: number
  resizeMode: ResizeMode
  resizeValue: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:outputFormat': [value: OutputFormat]
  'update:quality': [value: number]
  'update:resizeMode': [value: ResizeMode]
  'update:resizeValue': [value: number]
  reset: []
}>()

const formatOptions: { value: OutputFormat; label: string; description: string }[] = [
  { value: 'original', label: 'Keep Original', description: 'Same format as input' },
  { value: 'webp', label: 'WebP', description: 'Best balance of size & quality' },
  { value: 'avif', label: 'AVIF', description: 'Excellent compression, slower' },
  { value: 'jpeg', label: 'JPEG', description: 'Universal compatibility' },
  { value: 'png', label: 'PNG', description: 'Lossless, larger files' }
]

const resizeOptions: { value: ResizeMode; label: string }[] = [
  { value: 'none', label: 'No resize' },
  { value: 'width', label: 'By width' },
  { value: 'height', label: 'By height' },
  { value: 'max-dimension', label: 'Max dimension' }
]

const currentFormatConfig = computed(() => {
  if (props.outputFormat === 'original') return null
  return FORMAT_CONFIGS[props.outputFormat]
})

const qualityLabel = computed(() => currentFormatConfig.value?.qualityLabel || 'Quality')
const qualityMin = computed(() => currentFormatConfig.value?.qualityRange.min || 0)
const qualityMax = computed(() => currentFormatConfig.value?.qualityRange.max || 100)

const showQuality = computed(() => props.outputFormat !== 'original')
const showResizeValue = computed(() => props.resizeMode !== 'none')

function handleFormatChange(value: string) {
  const format = value as OutputFormat
  emit('update:outputFormat', format)

  // Update quality to format default
  if (format !== 'original') {
    emit('update:quality', FORMAT_CONFIGS[format].qualityDefault)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Format Selection -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">Output Format</Label>
      </div>

      <Select
        :model-value="outputFormat"
        :disabled="disabled"
        @update:model-value="handleFormatChange"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in formatOptions"
            :key="option.value"
            :value="option.value"
          >
            <div class="flex flex-col">
              <span>{{ option.label }}</span>
              <span class="text-xs text-muted-foreground">{{ option.description }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Quality Slider -->
    <div v-if="showQuality" class="space-y-3">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">{{ qualityLabel }}</Label>
        <span class="text-sm text-muted-foreground tabular-nums">{{ quality }}</span>
      </div>

      <Slider
        :model-value="[quality]"
        :min="qualityMin"
        :max="qualityMax"
        :step="1"
        :disabled="disabled"
        @update:model-value="emit('update:quality', $event[0])"
      />

      <div class="flex justify-between text-xs text-muted-foreground">
        <span>{{ outputFormat === 'png' ? 'Faster' : 'Smaller' }}</span>
        <span>{{ outputFormat === 'png' ? 'Smaller' : 'Better quality' }}</span>
      </div>
    </div>

    <!-- Resize Options -->
    <div class="space-y-3">
      <Label class="text-sm font-medium">Resize</Label>

      <Select
        :model-value="resizeMode"
        :disabled="disabled"
        @update:model-value="emit('update:resizeMode', $event as ResizeMode)"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select resize mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in resizeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <div v-if="showResizeValue" class="flex items-center gap-2">
        <Input
          type="number"
          :model-value="resizeValue"
          :min="1"
          :max="10000"
          :disabled="disabled"
          class="w-24"
          @update:model-value="emit('update:resizeValue', Number($event))"
        />
        <span class="text-sm text-muted-foreground">pixels</span>
      </div>
    </div>

    <!-- Reset Button -->
    <Button
      variant="outline"
      size="sm"
      class="w-full"
      :disabled="disabled"
      @click="emit('reset')"
    >
      <RotateCcw class="w-4 h-4 mr-2" />
      Reset to defaults
    </Button>
  </div>
</template>
