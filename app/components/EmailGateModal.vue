<script setup lang="ts">
import { Mail, Sparkles, Loader2, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  currentLimit: number
  upgradedLimit: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const { submitEmail, isSubmitting, submitError, clearError } = useEmailGate()

const email = ref('')
const showSuccess = ref(false)

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

async function handleSubmit() {
  if (!isValidEmail.value) return

  const success = await submitEmail(email.value)

  if (success) {
    showSuccess.value = true
    setTimeout(() => {
      emit('success')
      emit('update:open', false)
      // Reset state
      email.value = ''
      showSuccess.value = false
    }, 1500)
  }
}

function handleClose() {
  emit('update:open', false)
  email.value = ''
  clearError()
  showSuccess.value = false
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    email.value = ''
    clearError()
    showSuccess.value = false
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-primary" />
          Unlock more images
        </DialogTitle>
        <DialogDescription>
          You've reached the {{ currentLimit }} image limit. Enter your email to process up to {{ upgradedLimit }} images.
        </DialogDescription>
      </DialogHeader>

      <div v-if="showSuccess" class="py-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <Sparkles class="w-8 h-8 text-green-600" />
        </div>
        <p class="text-lg font-semibold text-green-900">You're upgraded!</p>
        <p class="text-sm text-muted-foreground">You can now process up to {{ upgradedLimit }} images.</p>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="email">Email address</Label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="pl-10"
              :disabled="isSubmitting"
              autocomplete="email"
            />
          </div>
        </div>

        <div v-if="submitError" class="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{{ submitError }}</span>
        </div>

        <p class="text-xs text-muted-foreground">
          We'll only use your email for occasional product updates. No spam, ever.
        </p>

        <div class="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="handleClose"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!isValidEmail || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
            {{ isSubmitting ? 'Unlocking...' : 'Unlock' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
