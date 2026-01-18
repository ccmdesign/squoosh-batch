<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  progress: number
  currentImage: string | null
  totalImages: number
  completedImages: number
}>()

const progressText = computed(() => {
  if (props.completedImages === props.totalImages) {
    return 'Complete!'
  }
  return `Processing ${props.completedImages + 1} of ${props.totalImages}`
})
</script>

<template>
  <div class="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
    <div class="flex items-center gap-3">
      <Loader2 class="w-5 h-5 text-primary animate-spin" />
      <div class="flex-1">
        <p class="text-sm font-medium">{{ progressText }}</p>
        <p v-if="currentImage" class="text-xs text-muted-foreground truncate">
          {{ currentImage }}
        </p>
      </div>
      <span class="text-sm font-medium tabular-nums">{{ Math.round(progress) }}%</span>
    </div>

    <Progress :model-value="progress" class="h-2" />
  </div>
</template>
