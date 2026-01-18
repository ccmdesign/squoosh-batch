<script setup lang="ts">
import { Download, FileArchive, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  imageCount: number
  disabled?: boolean
  isDownloading?: boolean
}>()

const emit = defineEmits<{
  downloadZip: []
  downloadIndividual: []
}>()

const canDownload = computed(() => props.imageCount > 0 && !props.disabled)
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3">
    <Button
      size="lg"
      class="flex-1"
      :disabled="!canDownload || isDownloading"
      @click="emit('downloadZip')"
    >
      <template v-if="isDownloading">
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        Creating ZIP...
      </template>
      <template v-else>
        <FileArchive class="w-4 h-4 mr-2" />
        Download as ZIP
      </template>
    </Button>

    <Button
      v-if="imageCount === 1"
      variant="outline"
      size="lg"
      class="flex-1"
      :disabled="!canDownload"
      @click="emit('downloadIndividual')"
    >
      <Download class="w-4 h-4 mr-2" />
      Download
    </Button>
  </div>
</template>
