import { defineConfig } from 'vitest/config'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
    testTimeout: 120_000,
    // beforeAll hooks scaffold + install (up to 300s) + build (up to 1500s
    // for pdf/share — a solo production build takes ~9.5 min on a local
    // Windows machine) + start a server. Timeouts only bite when something
    // is genuinely wrong; healthy runs are unaffected by the headroom.
    hookTimeout: 1_800_000,
    globalSetup: './setup/global-setup.ts',
    include: ['**/*.e2e.test.ts'],
    fileParallelism: !process.env.CI,
    // Each suite scaffolds and installs a full Nuxt app; pdf/share also run
    // production builds and the rest start dev servers. Running all six at
    // once overwhelms a local Windows machine in ever-varying ways (install
    // timeouts, silently killed postinstalls, saturated network), so cap
    // local parallelism at two suites.
    maxWorkers: process.env.CI ? 1 : 2
  }
})
