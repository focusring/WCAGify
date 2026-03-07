import { defineConfig } from 'vitest/config'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
    testTimeout: 120_000,
    hookTimeout: 300_000,
    globalSetup: './setup/global-setup.ts',
    include: ['**/*.e2e.test.ts'],
    fileParallelism: false,
    retry: 1
  }
})
