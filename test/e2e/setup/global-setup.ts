import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanupTmpDir, getTmpDir, packWcagify, scaffoldProject } from './test-utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '../../..')

function buildPackages(): void {
  console.log('Building @focusring/wcagify...')
  execSync('pnpm --filter @focusring/wcagify build', {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  })

  console.log('Building create-wcagify CLI...')
  execSync('pnpm --filter create-wcagify build', {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  })

  const cliBinary = join(ROOT_DIR, 'packages/create-wcagify/dist/cli.js')
  if (!existsSync(cliBinary)) {
    throw new Error('Build failed: packages/create-wcagify/dist/cli.js not found')
  }
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  console.log('Cleaning up .tmp directory before tests...')
  cleanupTmpDir()

  mkdirSync(getTmpDir(), { recursive: true })

  buildPackages()

  console.log('Packing @focusring/wcagify tarball...')
  packWcagify()

  console.log('Scaffolding base project for e2e tests...')
  scaffoldProject('base-project')
  console.log('Base project scaffolded.')

  return async () => {
    const wcagifyDir = join(ROOT_DIR, 'packages/wcagify')
    for (const file of readdirSync(wcagifyDir)) {
      if (file.endsWith('.tgz')) {
        rmSync(join(wcagifyDir, file))
      }
    }

    const testsFailed = process.exitCode === 1
    if (!testsFailed) {
      console.log('All tests passed. Cleaning up .tmp directory...')
      cleanupTmpDir()
    } else {
      console.log('Tests failed. Preserving .tmp directory for debugging.')
    }
  }
}
