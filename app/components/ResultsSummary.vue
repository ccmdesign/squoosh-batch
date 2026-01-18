<script setup lang="ts">
import { CheckCircle, TrendingDown, TrendingUp } from 'lucide-vue-next'

const props = defineProps<{
  originalSize: number
  processedSize: number
  imageCount: number
}>()

const { formatFileSize, formatPercent } = useFileNaming()

const savings = computed(() => {
  const saved = props.originalSize - props.processedSize
  const percent = props.originalSize > 0 ? (saved / props.originalSize) * 100 : 0

  return {
    bytes: saved,
    percent,
    isSmaller: saved > 0
  }
})
</script>

<template>
  <div class="p-4 rounded-lg bg-green-50 border border-green-200">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <CheckCircle class="w-5 h-5 text-green-600" />
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-green-900">
          {{ imageCount }} image{{ imageCount !== 1 ? 's' : '' }} optimized!
        </h3>

        <div class="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <span class="text-green-700/70">Original:</span>
            <span class="ml-1 font-medium text-green-900">{{ formatFileSize(originalSize) }}</span>
          </div>
          <div>
            <span class="text-green-700/70">Optimized:</span>
            <span class="ml-1 font-medium text-green-900">{{ formatFileSize(processedSize) }}</span>
          </div>
        </div>

        <div class="mt-2 flex items-center gap-2">
          <component
            :is="savings.isSmaller ? TrendingDown : TrendingUp"
            class="w-4 h-4"
            :class="savings.isSmaller ? 'text-green-600' : 'text-amber-600'"
          />
          <span
            class="text-sm font-medium"
            :class="savings.isSmaller ? 'text-green-700' : 'text-amber-700'"
          >
            <template v-if="savings.isSmaller">
              Saved {{ formatFileSize(savings.bytes) }} ({{ formatPercent(savings.percent) }})
            </template>
            <template v-else>
              Size increased by {{ formatFileSize(Math.abs(savings.bytes)) }}
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
