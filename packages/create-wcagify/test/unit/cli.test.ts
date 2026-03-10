import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(() => Promise.resolve())
}))

vi.mock('../../src/create.js', () => ({
  create: mockCreate
}))

vi.mock('../../src/version.js', () => ({
  CLI_VERSION: '0.2.0'
}))

import { run } from '../../src/cli'

const ORIGINAL_ARGV = process.argv.slice()

describe('run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.argv = ORIGINAL_ARGV.slice()
  })

  it('is a function', () => {
    expect(typeof run).toBe('function')
  })

  it('parses empty args without throwing', async () => {
    process.argv = ['node', 'cli.js']
    await expect(run()).resolves.toBeUndefined()
  })

  it('passes project name and options to create', async () => {
    process.argv = ['node', 'cli.js', 'create', 'my-project', '--no-git', '--no-install']
    await run()
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'my-project', git: false, install: false })
    )
  })

  it('passes --git and --install flags to create', async () => {
    process.argv = ['node', 'cli.js', 'create', 'my-project', '--git', '--install']
    await run()
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'my-project', git: true, install: true })
    )
  })

  it('propagates errors from create', async () => {
    mockCreate.mockRejectedValueOnce(new Error('create failed'))
    process.argv = ['node', 'cli.js', 'create', 'test']
    await expect(run()).rejects.toThrow('create failed')
  })
})
