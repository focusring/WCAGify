import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/pdf/index.ts', 'src/module.ts', 'src/config.ts', 'src/content.ts'],
  format: 'esm',
  dts: true,
  outDir: 'dist',
  clean: true,
  hash: false,
  deps: {
    neverBundle: ['@nuxt/content', '@nuxt/kit', '@nuxt/schema']
  },
  outExtensions: () => ({ js: '.js', dts: '.d.ts' })
})
