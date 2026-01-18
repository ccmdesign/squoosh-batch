<script setup lang="ts">
import { ImageIcon, Github } from 'lucide-vue-next'
</script>

<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <ImageIcon class="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 class="font-semibold leading-none">Squoosh Batch</h1>
          <p class="text-xs text-muted-foreground">Compress images in your browser</p>
        </div>
      </div>

      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Github class="w-5 h-5" />
      </a>
    </div>
  </header>
</template>
