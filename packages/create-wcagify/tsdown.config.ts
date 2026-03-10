import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: 'esm',
    dts: true,
    outDir: 'dist',
    clean: true,
    hash: false,
    outExtensions: () => ({ js: '.js', dts: '.d.ts' })
  },
  {
    entry: ['src/cli.ts'],
    format: 'esm',
    dts: true,
    outDir: 'dist',
    hash: false,
    outputOptions: {
      banner: '#!/usr/bin/env node\n'
    },
    outExtensions: () => ({ js: '.js', dts: '.d.ts' })
  }
])
