<script setup lang="ts">
import { Upload, ImageIcon } from 'lucide-vue-next'

const props = defineProps<{
  currentCount: number
  maxCount: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  filesSelected: [files: File[]]
  limitReached: []
}>()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
const acceptString = acceptedTypes.join(',')

const remainingSlots = computed(() => props.maxCount - props.currentCount)
const canAddMore = computed(() => remainingSlots.value > 0)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (!props.disabled && canAddMore.value) {
    isDragging.value = true
  }
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  if (props.disabled) return

  const files = Array.from(e.dataTransfer?.files || [])
  processFiles(files)
}

function handleClick() {
  if (props.disabled) return

  if (!canAddMore.value) {
    emit('limitReached')
    return
  }

  fileInputRef.value?.click()
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processFiles(files)

  // Reset input so same file can be selected again
  target.value = ''
}

function processFiles(files: File[]) {
  // Filter for accepted types
  const validFiles = files.filter(file => acceptedTypes.includes(file.type))

  if (validFiles.length === 0) return

  // Check if adding these files would exceed limit
  if (validFiles.length > remainingSlots.value) {
    // Take only what we can
    const filesToAdd = validFiles.slice(0, remainingSlots.value)
    emit('filesSelected', filesToAdd)

    // Show limit reached if we couldn't add all
    if (filesToAdd.length < validFiles.length) {
      emit('limitReached')
    }
  } else {
    emit('filesSelected', validFiles)
  }
}
</script>

<template>
  <div
    class="relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer"
    :class="{
      'border-primary bg-primary/5': isDragging,
      'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50': !isDragging && !disabled,
      'border-muted-foreground/10 bg-muted/30 cursor-not-allowed': disabled
    }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleClick"
  >
    <input
      ref="fileInputRef"
      type="file"
      :accept="acceptString"
      multiple
      class="hidden"
      :disabled="disabled"
      @change="handleFileSelect"
    />

    <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors"
        :class="{
          'bg-primary/10 text-primary': isDragging,
          'bg-muted text-muted-foreground': !isDragging
        }"
      >
        <Upload v-if="!isDragging" class="w-8 h-8" />
        <ImageIcon v-else class="w-8 h-8" />
      </div>

      <h3 class="text-lg font-semibold mb-1">
        <template v-if="isDragging">Drop images here</template>
        <template v-else>Drop images or click to upload</template>
      </h3>

      <p class="text-sm text-muted-foreground mb-3">
        PNG, JPG, or WebP up to 20MB each
      </p>

      <p class="text-xs text-muted-foreground">
        <template v-if="canAddMore">
          {{ remainingSlots }} of {{ maxCount }} slots available
        </template>
        <template v-else>
          <span class="text-destructive">Limit reached ({{ maxCount }} images)</span>
        </template>
      </p>
    </div>
  </div>
</template>
