import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import uiOptions from './ui.config'

export default defineConfig({
  plugins: [vue(), ui(uiOptions)],
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'happy-dom'
  }
})
