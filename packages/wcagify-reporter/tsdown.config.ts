import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/data/index.ts'],
  format: 'esm',
  dts: true,
  outDir: 'dist',
  clean: false,
  hash: false,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' })
})
