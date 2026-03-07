import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { cleanupProject, getTmpDir, runCli, scaffoldProject } from './setup/test-utils.js'

describe('CLI Scaffolding E2E', () => {
  const TEST_PROJECT_NAME = 'scaffolding-e2e-test'

  afterAll(() => {
    cleanupProject(TEST_PROJECT_NAME)
  })

  describe('folder structure', () => {
    let projectPath: string

    beforeAll(() => {
      cleanupProject(TEST_PROJECT_NAME)
      projectPath = scaffoldProject(TEST_PROJECT_NAME)
    })

    it('creates expected directory structure', () => {
      expect(existsSync(projectPath)).toBe(true)
      expect(existsSync(join(projectPath, 'content'))).toBe(true)
      expect(existsSync(join(projectPath, 'content', 'reports'))).toBe(true)
      expect(existsSync(join(projectPath, 'content', 'reports', 'example'))).toBe(true)
    })

    it('creates all config files', () => {
      expect(existsSync(join(projectPath, 'package.json'))).toBe(true)
      expect(existsSync(join(projectPath, 'nuxt.config.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'content.config.ts'))).toBe(true)
      expect(existsSync(join(projectPath, 'tsconfig.json'))).toBe(true)
      expect(existsSync(join(projectPath, '.gitignore'))).toBe(true)
      expect(existsSync(join(projectPath, '.npmrc'))).toBe(true)
    })

    it('creates example report with issue files', () => {
      const reportDir = join(projectPath, 'content', 'reports', 'example')
      expect(existsSync(join(reportDir, 'index.md'))).toBe(true)
      expect(existsSync(join(reportDir, 'focus-style-missing.md'))).toBe(true)
      expect(existsSync(join(reportDir, 'no-keyboard.md'))).toBe(true)
    })
  })

  describe('package.json validation', () => {
    let projectPath: string

    beforeAll(() => {
      projectPath = join(getTmpDir(), TEST_PROJECT_NAME)
    })

    it('has correct project name', () => {
      const pkg = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'))
      expect(pkg.name).toBe(TEST_PROJECT_NAME)
      expect(pkg.private).toBe(true)
    })

    it('includes required scripts', () => {
      const pkg = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'))
      expect(pkg.scripts.dev).toBe('nuxt dev')
      expect(pkg.scripts.build).toBe('nuxt build')
      expect(pkg.scripts.preview).toBe('nuxt preview')
    })

    it('includes @focusring/wcagify as dependency', () => {
      const pkg = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['@focusring/wcagify']).toBeDefined()
      expect(pkg.dependencies['@nuxt/content']).toBeDefined()
      expect(pkg.dependencies['nuxt']).toBeDefined()
    })
  })

  describe('config file contents', () => {
    let projectPath: string

    beforeAll(() => {
      projectPath = join(getTmpDir(), TEST_PROJECT_NAME)
    })

    it('nuxt.config.ts uses defineWcagifyConfig', () => {
      const content = readFileSync(join(projectPath, 'nuxt.config.ts'), 'utf-8')
      expect(content).toContain('defineWcagifyConfig')
    })

    it('content.config.ts uses defineWcagifyCollections', () => {
      const content = readFileSync(join(projectPath, 'content.config.ts'), 'utf-8')
      expect(content).toContain('defineWcagifyCollections')
    })
  })

  describe('example report content', () => {
    let projectPath: string

    beforeAll(() => {
      projectPath = join(getTmpDir(), TEST_PROJECT_NAME)
    })

    it('issue files contain WCAG success criterion', () => {
      const focusIssue = readFileSync(
        join(projectPath, 'content', 'reports', 'example', 'focus-style-missing.md'),
        'utf-8'
      )
      expect(focusIssue).toContain('sc:')
      expect(focusIssue).toContain('2.4.7')
      expect(focusIssue).toContain('severity: Medium')

      const keyboardIssue = readFileSync(
        join(projectPath, 'content', 'reports', 'example', 'no-keyboard.md'),
        'utf-8'
      )
      expect(keyboardIssue).toContain('sc:')
      expect(keyboardIssue).toContain('2.1.1')
      expect(keyboardIssue).toContain('severity: High')
    })

    it('report index contains evaluation metadata', () => {
      const report = readFileSync(
        join(projectPath, 'content', 'reports', 'example', 'index.md'),
        'utf-8'
      )
      expect(report).toContain('evaluator:')
      expect(report).toContain('target:')
    })
  })

  describe('invalid name handling', () => {
    it('rejects project name with uppercase letters', () => {
      const result = runCli('create InvalidName --no-git --no-install', getTmpDir())
      expect(result.exitCode).not.toBe(0)
      expect(result.stdout + result.stderr).toContain('lowercase')
    })

    it('rejects project name with special characters', () => {
      const result = runCli('create invalid_name! --no-git --no-install', getTmpDir())
      expect(result.exitCode).not.toBe(0)
      expect(result.stdout + result.stderr).toContain('alphanumeric')
    })

    it('rejects project name starting with hyphen', () => {
      const result = runCli('create "-invalid" --no-git --no-install', getTmpDir())
      expect(result.exitCode).not.toBe(0)
    })

    it('rejects project name ending with hyphen', () => {
      const result = runCli('create invalid- --no-git --no-install', getTmpDir())
      expect(result.exitCode).not.toBe(0)
      expect(result.stdout + result.stderr).toContain('hyphen')
    })
  })
})
