<script setup lang="ts">
import { Play, RefreshCw } from 'lucide-vue-next'

// Composables
const {
  images,
  addImages,
  removeImage,
  clearQueue,
  resetQueue,
  setStatus,
  setProgress,
  setCompleted,
  setError,
  completedImages,
  totalOriginalSize,
  totalProcessedSize,
  overallProgress,
  isProcessing: isQueueProcessing,
  hasImages,
  hasCompletedImages
} = useImageQueue()

const {
  settings,
  setOutputFormat,
  setQuality,
  setResizeMode,
  setResizeValue,
  resetToDefaults
} = useCompressionSettings()

const {
  maxImages,
  canAddMore,
  hasProvidedEmail
} = useEmailGate()

const {
  processQueue,
  isProcessing: isWorkerProcessing,
  currentImageId
} = useImageProcessor()

const {
  downloadSingle,
  downloadAsZip,
  isDownloading
} = useDownload()

// Local state
const showEmailGate = ref(false)
const hasStartedProcessing = ref(false)

// Computed
const isProcessing = computed(() => isQueueProcessing.value || isWorkerProcessing.value)
const canProcess = computed(() => hasImages.value && !isProcessing.value && !hasCompletedImages.value)
const showResults = computed(() => hasCompletedImages.value && !isProcessing.value)

const currentProcessingImage = computed(() => {
  if (!currentImageId.value) return null
  const img = images.value.find(i => i.id === currentImageId.value)
  return img?.originalName || null
})

// Handlers
function handleFilesSelected(files: File[]) {
  addImages(files)
}

function handleLimitReached() {
  if (!hasProvidedEmail.value) {
    showEmailGate.value = true
  }
}

function handleRemoveImage(id: string) {
  removeImage(id)
}

function handleClearQueue() {
  clearQueue()
  hasStartedProcessing.value = false
}

async function handleStartProcessing() {
  hasStartedProcessing.value = true

  await processQueue(
    images.value,
    settings.value,
    {
      onStart: (id) => setStatus(id, 'processing'),
      onProgress: (id, percent) => setProgress(id, percent),
      onComplete: (id, blob) => setCompleted(id, blob),
      onError: (id, error) => setError(id, error)
    }
  )
}

function handleResetAndTryAgain() {
  resetQueue()
  hasStartedProcessing.value = false
}

async function handleDownloadZip() {
  const completed = images.value.filter(img => img.status === 'completed')
  await downloadAsZip(completed, settings.value.outputFormat)
}

function handleDownloadIndividual() {
  const completed = images.value.filter(img => img.status === 'completed')
  if (completed.length === 1) {
    downloadSingle(completed[0], settings.value.outputFormat)
  }
}

function handleEmailSuccess() {
  showEmailGate.value = false
}

// SEO
useHead({
  title: 'Squoosh Batch - Compress Images in Your Browser',
  meta: [
    {
      name: 'description',
      content: 'Free online batch image compressor. Compress PNG, JPG, and WebP images right in your browser. No uploads, 100% private.'
    }
  ]
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />

    <main class="flex-1 container mx-auto px-4 py-8">
      <div class="max-w-5xl mx-auto">
        <!-- Hero section when no images -->
        <div v-if="!hasImages" class="text-center mb-8">
          <h2 class="text-3xl font-bold tracking-tight mb-3">
            Batch compress your images
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Optimize multiple images at once using Squoosh-quality compression.
            100% private — everything happens in your browser.
          </p>
        </div>

        <!-- Main content grid -->
        <div class="grid lg:grid-cols-[1fr,320px] gap-8">
          <!-- Left column: Dropzone and Queue -->
          <div class="space-y-6">
            <!-- Dropzone -->
            <ImageDropzone
              :current-count="images.length"
              :max-count="maxImages"
              :disabled="isProcessing"
              @files-selected="handleFilesSelected"
              @limit-reached="handleLimitReached"
            />

            <!-- Processing progress -->
            <ProcessingProgress
              v-if="isProcessing"
              :progress="overallProgress"
              :current-image="currentProcessingImage"
              :total-images="images.length"
              :completed-images="completedImages.length"
            />

            <!-- Results summary -->
            <ResultsSummary
              v-if="showResults"
              :original-size="totalOriginalSize"
              :processed-size="totalProcessedSize"
              :image-count="completedImages.length"
            />

            <!-- Download actions -->
            <DownloadActions
              v-if="showResults"
              :image-count="completedImages.length"
              :is-downloading="isDownloading"
              @download-zip="handleDownloadZip"
              @download-individual="handleDownloadIndividual"
            />

            <!-- Image queue -->
            <Card v-if="hasImages">
              <CardContent class="pt-6">
                <ImageQueue
                  :images="images"
                  :output-format="settings.outputFormat"
                  :disabled="isProcessing"
                  @remove="handleRemoveImage"
                  @clear="handleClearQueue"
                />
              </CardContent>
            </Card>
          </div>

          <!-- Right column: Settings -->
          <div v-if="hasImages" class="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle class="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <CompressionSettings
                  :output-format="settings.outputFormat"
                  :quality="settings.quality"
                  :resize-mode="settings.resizeMode"
                  :resize-value="settings.resizeValue"
                  :disabled="isProcessing"
                  @update:output-format="setOutputFormat"
                  @update:quality="setQuality"
                  @update:resize-mode="setResizeMode"
                  @update:resize-value="setResizeValue"
                  @reset="resetToDefaults"
                />
              </CardContent>
              <CardFooter>
                <Button
                  v-if="canProcess"
                  class="w-full"
                  size="lg"
                  @click="handleStartProcessing"
                >
                  <Play class="w-4 h-4 mr-2" />
                  Compress {{ images.length }} image{{ images.length !== 1 ? 's' : '' }}
                </Button>

                <Button
                  v-else-if="showResults"
                  variant="outline"
                  class="w-full"
                  size="lg"
                  @click="handleResetAndTryAgain"
                >
                  <RefreshCw class="w-4 h-4 mr-2" />
                  Process again
                </Button>

                <Button
                  v-else-if="isProcessing"
                  class="w-full"
                  size="lg"
                  disabled
                >
                  Processing...
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <!-- Features section when no images -->
        <div v-if="!hasImages" class="mt-16 grid sm:grid-cols-3 gap-6">
          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="text-xl">🔒</span>
            </div>
            <h3 class="font-semibold mb-2">100% Private</h3>
            <p class="text-sm text-muted-foreground">
              Your images never leave your browser. All processing happens locally.
            </p>
          </div>

          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="text-xl">⚡</span>
            </div>
            <h3 class="font-semibold mb-2">Squoosh Quality</h3>
            <p class="text-sm text-muted-foreground">
              Powered by the same codecs as Google's Squoosh. MozJPEG, WebP, AVIF, and more.
            </p>
          </div>

          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="text-xl">📦</span>
            </div>
            <h3 class="font-semibold mb-2">Batch Processing</h3>
            <p class="text-sm text-muted-foreground">
              Compress up to {{ maxImages }} images at once. Download individually or as a ZIP.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t py-6">
      <div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          Built with
          <a href="https://github.com/jamsinclair/jSquash" target="_blank" rel="noopener" class="underline hover:text-foreground">jSquash</a>
          and
          <a href="https://nuxt.com" target="_blank" rel="noopener" class="underline hover:text-foreground">Nuxt</a>.
          All processing happens in your browser.
        </p>
      </div>
    </footer>

    <!-- Email gate modal -->
    <EmailGateModal
      v-model:open="showEmailGate"
      :current-limit="10"
      :upgraded-limit="50"
      @success="handleEmailSuccess"
    />
  </div>
</template>
