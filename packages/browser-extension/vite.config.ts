import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [vue(), ui(), crx({ manifest })],
  optimizeDeps: {
    exclude: [
      '@tiptap/core',
      '@tiptap/vue-3',
      '@tiptap/pm',
      '@tiptap/starter-kit',
      '@tiptap/markdown',
      '@tiptap/extension-code',
      '@tiptap/extension-drag-handle-vue-3',
      '@tiptap/extension-horizontal-rule',
      '@tiptap/extension-image',
      '@tiptap/extension-mention',
      '@tiptap/extension-placeholder'
    ]
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600
  }
})
