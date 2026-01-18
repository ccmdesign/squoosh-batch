const STORAGE_KEY = 'squoosh-batch-email-provided'
const ANONYMOUS_LIMIT = 10
const UPGRADED_LIMIT = 50

// Mailchimp JSONP configuration
const MAILCHIMP_URL = 'https://claudiomendonca.us2.list-manage.com/subscribe/post-json'
const MAILCHIMP_U = '468ffb5e21f0082332ecdd5f3'
const MAILCHIMP_ID = 'eaa305764b'
const MAILCHIMP_F_ID = '0074d8e3f0'

export function useEmailGate() {
  const hasProvidedEmail = ref(false)
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  // Load state from localStorage on mount
  onMounted(() => {
    hasProvidedEmail.value = localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const maxImages = computed(() =>
    hasProvidedEmail.value ? UPGRADED_LIMIT : ANONYMOUS_LIMIT
  )

  const limitLabel = computed(() =>
    hasProvidedEmail.value ? `${UPGRADED_LIMIT} images` : `${ANONYMOUS_LIMIT} images`
  )

  function canAddMore(currentCount: number, adding: number = 1): boolean {
    return currentCount + adding <= maxImages.value
  }

  function remainingSlots(currentCount: number): number {
    return Math.max(0, maxImages.value - currentCount)
  }

  async function submitEmail(email: string): Promise<boolean> {
    if (!email || !isValidEmail(email)) {
      submitError.value = 'Please enter a valid email address'
      return false
    }

    isSubmitting.value = true
    submitError.value = null

    try {
      const result = await subscribeViaJsonp(email)

      if (result.success) {
        hasProvidedEmail.value = true
        localStorage.setItem(STORAGE_KEY, 'true')
        return true
      } else {
        submitError.value = result.message || 'Subscription failed. Please try again.'
        return false
      }
    } catch (error) {
      submitError.value = 'Network error. Please try again.'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  function clearError() {
    submitError.value = null
  }

  return {
    hasProvidedEmail: readonly(hasProvidedEmail),
    maxImages,
    limitLabel,
    isSubmitting: readonly(isSubmitting),
    submitError: readonly(submitError),
    canAddMore,
    remainingSlots,
    submitEmail,
    clearError
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface JsonpResult {
  success: boolean
  message?: string
}

function subscribeViaJsonp(email: string): Promise<JsonpResult> {
  return new Promise((resolve) => {
    // Create unique callback name
    const callbackName = `mailchimpCallback_${Date.now()}`

    // Build URL with JSONP callback
    const url = new URL(MAILCHIMP_URL)
    url.searchParams.set('u', MAILCHIMP_U)
    url.searchParams.set('id', MAILCHIMP_ID)
    url.searchParams.set('f_id', MAILCHIMP_F_ID)
    url.searchParams.set('EMAIL', email)
    url.searchParams.set('c', callbackName)

    // Set up timeout
    const timeout = setTimeout(() => {
      cleanup()
      resolve({ success: false, message: 'Request timed out' })
    }, 10000)

    // Define callback function
    ;(window as any)[callbackName] = (response: any) => {
      cleanup()

      if (response.result === 'success') {
        resolve({ success: true })
      } else if (response.result === 'error') {
        // Check if already subscribed (this is actually success for our use case)
        if (response.msg && response.msg.includes('already subscribed')) {
          resolve({ success: true, message: 'Already subscribed' })
        } else {
          resolve({ success: false, message: response.msg || 'Subscription failed' })
        }
      } else {
        resolve({ success: false, message: 'Unknown response' })
      }
    }

    // Create script element
    const script = document.createElement('script')
    script.src = url.toString()
    script.onerror = () => {
      cleanup()
      resolve({ success: false, message: 'Network error' })
    }

    // Cleanup function
    function cleanup() {
      clearTimeout(timeout)
      delete (window as any)[callbackName]
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }

    // Add script to document
    document.head.appendChild(script)
  })
}
