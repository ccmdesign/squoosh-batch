import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-18',
  future: {
    compatibilityVersion: 4
  },
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  build: {
    transpile: [
      '@jsquash/jpeg',
      '@jsquash/png',
      '@jsquash/webp',
      '@jsquash/avif',
      '@jsquash/oxipng',
      '@jsquash/resize'
    ]
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: [
        '@jsquash/jpeg',
        '@jsquash/png',
        '@jsquash/webp',
        '@jsquash/avif',
        '@jsquash/oxipng',
        '@jsquash/resize'
      ]
    },
    worker: {
      format: 'es'
    }
  },

  modules: ['shadcn-nuxt'],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  }
})