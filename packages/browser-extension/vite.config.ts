import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [vue(), ui(), crx({ manifest })],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600
  }
})
