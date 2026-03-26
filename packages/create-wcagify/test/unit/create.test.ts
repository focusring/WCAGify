import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'node:path'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { EventEmitter } from 'node:events'

const { mockSpawn } = vi.hoisted(() => {
  const mockSpawn = vi.fn()
  return { mockSpawn }
})

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return { ...actual, spawn: mockSpawn }
})

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() })),
  text: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false)
}))

vi.mock('picocolors', () => ({
  default: {
    cyan: (s: string) => s,
    green: (s: string) => s,
    dim: (s: string) => s
  }
}))

vi.mock('../../src/version.js', () => ({
  fetchLatestWcagifyVersion: vi.fn(() => Promise.resolve('1.0.0'))
}))

import {
  validateProjectName,
  getOutputFileName,
  createSafeSpinner,
  trackPath,
  cleanup,
  renderTemplatesRecursively,
  runCommand,
  create
} from '../../src/create'
import { log } from '@clack/prompts'

describe('validateProjectName', () => {
  it('accepts valid lowercase name', () => {
    expect(validateProjectName('my-audit')).toBeUndefined()
  })

  it('accepts simple lowercase name', () => {
    expect(validateProjectName('audit')).toBeUndefined()
  })

  it('accepts name with numbers', () => {
    expect(validateProjectName('audit-2024')).toBeUndefined()
  })

  it('rejects empty string', () => {
    expect(validateProjectName('')).toBeDefined()
  })

  it('rejects whitespace-only', () => {
    expect(validateProjectName('   ')).toBeDefined()
  })

  it('rejects uppercase letters', () => {
    expect(validateProjectName('MyAudit')).toBeDefined()
  })

  it('rejects special characters', () => {
    expect(validateProjectName('my_audit')).toBeDefined()
  })

  it('rejects spaces', () => {
    expect(validateProjectName('my audit')).toBeDefined()
  })

  it('rejects leading hyphen', () => {
    expect(validateProjectName('-audit')).toBeDefined()
  })

  it('rejects trailing hyphen', () => {
    expect(validateProjectName('audit-')).toBeDefined()
  })
})

describe('getOutputFileName', () => {
  it('strips .ejs extension', () => {
    expect(getOutputFileName('package.json.ejs')).toBe('package.json')
  })

  it('maps gitignore to .gitignore', () => {
    expect(getOutputFileName('gitignore.ejs')).toBe('.gitignore')
  })

  it('maps env.example to .env.example', () => {
    expect(getOutputFileName('env.example.ejs')).toBe('.env.example')
  })

  it('handles regular file names', () => {
    expect(getOutputFileName('nuxt.config.ts.ejs')).toBe('nuxt.config.ts')
  })

  it('handles nested template names', () => {
    expect(getOutputFileName('content.config.ts.ejs')).toBe('content.config.ts')
  })
})

describe('createSafeSpinner', () => {
  it('returns an object with start, stop, message methods', () => {
    const s = createSafeSpinner()
    expect(s).toHaveProperty('start')
    expect(s).toHaveProperty('stop')
    expect(s).toHaveProperty('message')
    expect(typeof s.start).toBe('function')
    expect(typeof s.stop).toBe('function')
    expect(typeof s.message).toBe('function')
  })

  it('noop spinner methods do not throw', () => {
    const s = createSafeSpinner()
    expect(() => s.start('test')).not.toThrow()
    expect(() => s.stop('test')).not.toThrow()
    expect(() => s.message('test')).not.toThrow()
  })

  it('creates TTY spinner when TTY is available and methods work', () => {
    const origStdout = process.stdout.isTTY
    const origStdin = process.stdin.isTTY
    process.stdout.isTTY = true
    process.stdin.isTTY = true
    const s = createSafeSpinner()
    expect(() => s.start('loading')).not.toThrow()
    expect(() => s.message('updating')).not.toThrow()
    expect(() => s.stop('done')).not.toThrow()
    process.stdout.isTTY = origStdout
    process.stdin.isTTY = origStdin
  })
})

describe('trackPath and cleanup', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `wcagify-cleanup-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('trackPath adds a path and cleanup removes it', () => {
    const testFile = join(tempDir, 'test.txt')
    writeFileSync(testFile, 'hello')
    trackPath(testFile)
    expect(existsSync(testFile)).toBe(true)
    cleanup()
    expect(existsSync(testFile)).toBe(false)
  })
})

describe('renderTemplatesRecursively', () => {
  let tempDir: string
  let sourceDir: string
  let targetDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `wcagify-test-${Date.now()}`)
    sourceDir = join(tempDir, 'source')
    targetDir = join(tempDir, 'target')
    mkdirSync(sourceDir, { recursive: true })
    mkdirSync(targetDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('renders .ejs files into target directory', async () => {
    writeFileSync(join(sourceDir, 'test.txt.ejs'), 'Hello <%= projectName %>')
    await renderTemplatesRecursively(sourceDir, targetDir, {
      projectName: 'my-project',
      wcagifyVersion: '^1.0.0',
      date: '2025-01-01'
    })
    const outputPath = join(targetDir, 'test.txt')
    expect(existsSync(outputPath)).toBe(true)
  })

  it('handles subdirectories recursively', async () => {
    const subDir = join(sourceDir, 'sub')
    mkdirSync(subDir)
    writeFileSync(join(subDir, 'nested.txt.ejs'), '<%= projectName %>')
    await renderTemplatesRecursively(sourceDir, targetDir, {
      projectName: 'test',
      wcagifyVersion: '^1.0.0',
      date: '2025-01-01'
    })
    expect(existsSync(join(targetDir, 'sub', 'nested.txt'))).toBe(true)
  })

  it('skips non-ejs files', async () => {
    writeFileSync(join(sourceDir, 'readme.md'), '# Hello')
    await renderTemplatesRecursively(sourceDir, targetDir, {
      projectName: 'test',
      wcagifyVersion: '^1.0.0',
      date: '2025-01-01'
    })
    expect(existsSync(join(targetDir, 'readme.md'))).toBe(false)
  })
})

function createMockChildProcess(exitCode: number) {
  const emitter = new EventEmitter()
  setImmediate(() => emitter.emit('close', exitCode))
  return emitter
}

describe('runCommand', () => {
  it('resolves on successful command', async () => {
    mockSpawn.mockReturnValue(createMockChildProcess(0))
    await expect(runCommand('echo', ['hello'], process.cwd())).resolves.toBeUndefined()
  })

  it('rejects on failed command', async () => {
    mockSpawn.mockReturnValue(createMockChildProcess(1))
    await expect(runCommand('exit', ['1'], process.cwd())).rejects.toThrow(/exited with code/)
  })

  it('rejects on spawn error', async () => {
    const emitter = new EventEmitter()
    mockSpawn.mockReturnValue(emitter)
    const promise = runCommand('nonexistent', [], process.cwd())
    emitter.emit('error', new Error('spawn ENOENT'))
    await expect(promise).rejects.toThrow('spawn ENOENT')
  })
})

describe('create', () => {
  let tempDir: string
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit called')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = join(tmpdir(), `wcagify-create-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir)
    mockSpawn.mockImplementation(() => createMockChildProcess(0))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('creates a project with valid name and --no-git --no-install', async () => {
    await create({ name: 'test-project', git: false, install: false })
    const projectDir = join(tempDir, 'test-project')
    expect(existsSync(projectDir)).toBe(true)
  })

  it('exits with error for invalid project name', async () => {
    await expect(create({ name: 'INVALID' })).rejects.toThrow()
    expect(log.error).toHaveBeenCalled()
  })

  it('exits with error when directory already exists', async () => {
    mkdirSync(join(tempDir, 'existing'), { recursive: true })
    await expect(create({ name: 'existing' })).rejects.toThrow()
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining('already exists'))
  })

  it('handles git init and shows success', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await create({ name: 'git-test', git: true, install: false })
    consoleSpy.mockRestore()
  })

  it('handles install step', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await create({ name: 'install-test', git: false, install: true })
    consoleSpy.mockRestore()
  })

  it('shows pnpm install hint when install is skipped', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await create({ name: 'no-install-test', git: false, install: false })
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('pnpm install'))
    consoleSpy.mockRestore()
  })

  it('handles git init failure gracefully', async () => {
    mockSpawn.mockImplementation((cmd: string) => {
      return createMockChildProcess(cmd === 'git' ? 1 : 0)
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await create({ name: 'git-fail-test', git: true, install: false })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('Git initialization failed'))
    consoleSpy.mockRestore()
  })

  it('handles install failure gracefully', async () => {
    mockSpawn.mockImplementation((cmd: string) => {
      return createMockChildProcess(cmd === 'pnpm' ? 1 : 0)
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await create({ name: 'install-fail-test', git: false, install: true })
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('Dependency installation failed'))
    consoleSpy.mockRestore()
  })

  it('runs interactive prompts when no name is provided', async () => {
    const { text, confirm, isCancel } = await import('@clack/prompts')
    vi.mocked(text).mockResolvedValue('prompted-project')
    vi.mocked(confirm).mockResolvedValueOnce(false).mockResolvedValueOnce(false)
    vi.mocked(isCancel).mockReturnValue(false)

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await create({})
    expect(text).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(existsSync(join(tempDir, 'prompted-project'))).toBe(true)
    consoleSpy.mockRestore()
  })

  it('exits when user cancels project name prompt', async () => {
    const { text, isCancel, cancel } = await import('@clack/prompts')
    vi.mocked(text).mockResolvedValue(Symbol('cancel') as any)
    vi.mocked(isCancel).mockReturnValue(true)

    await expect(create({})).rejects.toThrow()
    expect(cancel).toHaveBeenCalledWith('Operation cancelled')
  })

  it('exits when user cancels git confirm prompt', async () => {
    const { text, confirm, isCancel, cancel } = await import('@clack/prompts')
    vi.mocked(text).mockResolvedValue('cancel-git-test')
    vi.mocked(isCancel).mockReturnValueOnce(false).mockReturnValueOnce(true)
    vi.mocked(confirm).mockResolvedValueOnce(Symbol('cancel') as any)

    await expect(create({})).rejects.toThrow()
    expect(cancel).toHaveBeenCalledWith('Operation cancelled')
  })

  it('exits when user cancels install confirm prompt', async () => {
    const { text, confirm, isCancel, cancel } = await import('@clack/prompts')
    vi.mocked(text).mockResolvedValue('cancel-install-test')
    vi.mocked(isCancel)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
    vi.mocked(confirm)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(Symbol('cancel') as any)

    await expect(create({})).rejects.toThrow()
    expect(cancel).toHaveBeenCalledWith('Operation cancelled')
  })

  it('cleans up created files on unexpected error', async () => {
    const { fetchLatestWcagifyVersion } = await import('../../src/version.js')
    vi.mocked(fetchLatestWcagifyVersion).mockRejectedValueOnce(new Error('boom'))

    await expect(create({ name: 'cleanup-test' })).rejects.toThrow()
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('Cleaning up'))
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Cleanup complete'))
    expect(existsSync(join(tempDir, 'cleanup-test'))).toBe(false)
  })
})
