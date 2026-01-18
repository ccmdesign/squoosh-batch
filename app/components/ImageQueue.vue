<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import type { QueuedImage, OutputFormat } from '~/types'

const props = defineProps<{
  images: readonly QueuedImage[]
  outputFormat: OutputFormat
  disabled?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
  clear: []
}>()

const hasImages = computed(() => props.images.length > 0)
</script>

<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-muted-foreground">
        {{ images.length }} image{{ images.length !== 1 ? 's' : '' }}
      </h3>

      <Button
        v-if="hasImages"
        variant="ghost"
        size="sm"
        class="text-muted-foreground hover:text-destructive"
        :disabled="disabled"
        @click="emit('clear')"
      >
        <Trash2 class="w-4 h-4 mr-1" />
        Clear all
      </Button>
    </div>

    <!-- Image list -->
    <div v-if="hasImages" class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      <ImageQueueItem
        v-for="image in images"
        :key="image.id"
        :image="image"
        :output-format="outputFormat"
        :disabled="disabled"
        @remove="emit('remove', $event)"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="py-8 text-center text-muted-foreground text-sm"
    >
      No images added yet
    </div>
  </div>
</template>
