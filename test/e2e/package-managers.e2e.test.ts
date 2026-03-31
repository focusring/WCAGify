import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  cleanupProject,
  getTmpDir,
  installDependencies,
  packWcagify,
  patchPackageJsonForLocalWcagify,
  startDevServer,
  stopDevServer
} from './setup/test-utils.js'

function hasCommand(command: string): boolean {
  try {
    execSync(`${command} --version`, { stdio: 'pipe', timeout: 10_000 })
    return true
  } catch {
    return false
  }
}

function isolateFromMonorepo(projectPath: string): void {
  const pkgPath = join(projectPath, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  delete pkg.packageManager
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8')
}

function installWithManager(manager: string, projectPath: string): void {
  if (manager !== 'pnpm') {
    isolateFromMonorepo(projectPath)
  }

  const envBase = { ...process.env, NO_COLOR: '1', CI: '1', COREPACK_ENABLE_STRICT: '0' }

  switch (manager) {
    case 'pnpm': {
      installDependencies(projectPath)
      return
    }

    case 'npm': {
      execSync('npm install --legacy-peer-deps', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 120_000,
        env: envBase
      })
      return
    }

    case 'bun': {
      execSync('bun install', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 120_000,
        env: envBase
      })
      return
    }
  }
}

function scaffoldProject(projectName: string): string {
  const tmpDir = getTmpDir()
  const projectPath = join(tmpDir, projectName)
  const cliBinary = join(tmpDir, '..', 'packages/create-wcagify/dist/cli.js')

  cleanupProject(projectName)

  execSync(`node "${cliBinary}" create ${projectName} --no-git --no-install`, {
    cwd: tmpDir,
    stdio: 'pipe',
    env: { ...process.env, NO_COLOR: '1' }
  })

  return projectPath
}

// Yarn v1 is excluded: corepack intercepts it when a parent directory has
// a packageManager field (our monorepo root), and there is no way to disable
// this from within the child process. This is a yarn v1 / corepack limitation.
const MANAGERS = ['pnpm', 'npm', 'bun'] as const

describe('Package Manager Smoke Tests', () => {
  let tarballPath: string

  beforeAll(() => {
    tarballPath = packWcagify()
  })

  for (const manager of MANAGERS) {
    const available = hasCommand(manager)

    describe.skipIf(!available)(`${manager}`, () => {
      const projectName = `pm-test-${manager}`
      let projectPath: string

      afterAll(() => {
        cleanupProject(projectName)
      })

      it('scaffolds a project', () => {
        projectPath = scaffoldProject(projectName)

        expect(existsSync(join(projectPath, 'package.json'))).toBe(true)
        expect(existsSync(join(projectPath, 'nuxt.config.ts'))).toBe(true)
        expect(existsSync(join(projectPath, 'content.config.ts'))).toBe(true)
      })

      it(`installs dependencies with ${manager}`, () => {
        patchPackageJsonForLocalWcagify(projectPath, tarballPath)
        installWithManager(manager, projectPath)

        expect(existsSync(join(projectPath, 'node_modules'))).toBe(true)
        expect(existsSync(join(projectPath, 'node_modules', 'nuxt'))).toBe(true)
        expect(existsSync(join(projectPath, 'node_modules', '@focusring', 'wcagify'))).toBe(true)
      })
    })
  }

  describe('dev server (pnpm)', () => {
    const projectName = 'pm-test-dev-server'
    let projectPath: string

    afterAll(() => {
      cleanupProject(projectName)
    })

    it('starts and responds', async () => {
      projectPath = scaffoldProject(projectName)
      patchPackageJsonForLocalWcagify(projectPath, tarballPath)
      installDependencies(projectPath)

      const { process: serverProcess, url } = await startDevServer(projectPath, 3104)

      try {
        const response = await fetch(url)
        expect(response.ok).toBe(true)

        const html = await response.text()
        expect(html).toContain('</html>')

        const apiResponse = await fetch(`${url}/api/reports`)
        expect(apiResponse.ok).toBe(true)

        const reports = await apiResponse.json()
        expect(Array.isArray(reports)).toBe(true)
      } finally {
        stopDevServer(serverProcess)
      }
    })
  })
})
