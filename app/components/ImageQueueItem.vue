<script setup lang="ts">
import { X, Check, AlertCircle, Loader2 } from 'lucide-vue-next'
import type { QueuedImage, OutputFormat } from '~/types'

const props = defineProps<{
  image: QueuedImage
  outputFormat: OutputFormat
  disabled?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const { formatFileSize, generateOutputFilename } = useFileNaming()

const outputFilename = computed(() =>
  generateOutputFilename(props.image.originalName, props.outputFormat, props.image.file.type)
)

const statusIcon = computed(() => {
  switch (props.image.status) {
    case 'completed':
      return Check
    case 'error':
      return AlertCircle
    case 'processing':
      return Loader2
    default:
      return null
  }
})

const statusColor = computed(() => {
  switch (props.image.status) {
    case 'completed':
      return 'text-green-600'
    case 'error':
      return 'text-destructive'
    case 'processing':
      return 'text-primary'
    default:
      return 'text-muted-foreground'
  }
})

const savings = computed(() => {
  if (props.image.status !== 'completed' || !props.image.processedSize) return null

  const saved = props.image.originalSize - props.image.processedSize
  const percent = (saved / props.image.originalSize) * 100

  return {
    bytes: saved,
    percent,
    isSmaller: saved > 0
  }
})

function handleRemove() {
  emit('remove', props.image.id)
}
</script>

<template>
  <div
    class="flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors"
    :class="{
      'border-green-200 bg-green-50/50': image.status === 'completed',
      'border-destructive/30 bg-destructive/5': image.status === 'error',
      'border-primary/30': image.status === 'processing'
    }"
  >
    <!-- Thumbnail -->
    <div class="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
      <img
        v-if="image.thumbnailUrl"
        :src="image.thumbnailUrl"
        :alt="image.originalName"
        class="w-full h-full object-cover"
      />

      <!-- Status overlay -->
      <div
        v-if="image.status !== 'pending'"
        class="absolute inset-0 flex items-center justify-center"
        :class="{
          'bg-green-500/20': image.status === 'completed',
          'bg-destructive/20': image.status === 'error',
          'bg-primary/20': image.status === 'processing'
        }"
      >
        <component
          :is="statusIcon"
          v-if="statusIcon"
          class="w-5 h-5"
          :class="[statusColor, { 'animate-spin': image.status === 'processing' }]"
        />
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate" :title="outputFilename">
        {{ outputFilename }}
      </p>

      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{{ formatFileSize(image.originalSize) }}</span>

        <template v-if="image.status === 'completed' && image.processedSize">
          <span class="text-muted-foreground/50">→</span>
          <span :class="{ 'text-green-600': savings?.isSmaller }">
            {{ formatFileSize(image.processedSize) }}
          </span>
          <span
            v-if="savings"
            class="px-1.5 py-0.5 rounded text-[10px] font-medium"
            :class="{
              'bg-green-100 text-green-700': savings.isSmaller,
              'bg-amber-100 text-amber-700': !savings.isSmaller
            }"
          >
            {{ savings.isSmaller ? '-' : '+' }}{{ Math.abs(savings.percent).toFixed(0) }}%
          </span>
        </template>

        <template v-else-if="image.status === 'processing'">
          <span class="text-primary">{{ image.progress }}%</span>
        </template>

        <template v-else-if="image.status === 'error'">
          <span class="text-destructive truncate" :title="image.error">
            {{ image.error || 'Processing failed' }}
          </span>
        </template>
      </div>

      <!-- Progress bar -->
      <div
        v-if="image.status === 'processing'"
        class="mt-1.5 h-1 bg-muted rounded-full overflow-hidden"
      >
        <div
          class="h-full bg-primary transition-all duration-300"
          :style="{ width: `${image.progress}%` }"
        />
      </div>
    </div>

    <!-- Remove button -->
    <button
      type="button"
      class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
      :disabled="disabled"
      @click="handleRemove"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</template>
