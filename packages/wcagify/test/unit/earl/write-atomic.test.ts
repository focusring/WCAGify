import { mkdtemp, readFile, readdir, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { EarlImport } from '../../../src/earl/parse'

// Fail the write of one specific issue file to simulate a filesystem error
// part-way through an import.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...actual,
    writeFile: vi.fn(async (path: Parameters<typeof actual.writeFile>[0], ...rest) => {
      if (String(path).endsWith('second-issue.md')) throw new Error('disk full')
      return actual.writeFile(path, ...(rest as [string]))
    })
  }
})

const { writeImportedReport } = await import('../../../src/earl/write')

function sampleImport(): EarlImport {
  return {
    report: {
      title: 'Atomic',
      description: '',
      language: 'en',
      evaluation: {
        evaluator: 'Eva',
        commissioner: 'Com',
        target: 'Atomic',
        targetLevel: 'AA',
        targetWcagVersion: '2.2',
        date: '2026-03-01',
        specialRequirements: ''
      },
      scope: ['https://example.com'],
      outOfScope: [],
      baseline: [],
      technologies: [],
      sample: [{ id: 'home', title: 'Home', url: 'https://example.com', description: '' }],
      scStatuses: { passed: ['1.1.1'], 'not-present': [] },
      summary: ''
    },
    issues: [
      { title: 'First issue', sc: '1.3.1', sample: 'home', body: 'one' },
      { title: 'Second issue', sc: '2.4.7', sample: 'home', body: 'two' }
    ],
    warnings: [],
    stats: { assertions: 2, criteriaWithOutcome: 2, unknownTests: [] }
  }
}

describe('writeImportedReport is all-or-nothing', () => {
  let contentDir: string

  beforeEach(async () => {
    contentDir = await mkdtemp(join(tmpdir(), 'wcagify-earl-atomic-'))
  })

  afterEach(async () => {
    await rm(contentDir, { recursive: true, force: true })
  })

  it('leaves no report behind when a create fails part-way', async () => {
    await expect(
      writeImportedReport(sampleImport(), { contentDir, slug: 'partial' })
    ).rejects.toThrow('disk full')
    expect(await readdir(join(contentDir, 'reports'))).toEqual([])
  })

  it('restores the original report when a merge fails part-way', async () => {
    const reportDir = join(contentDir, 'reports/existing')
    await mkdir(reportDir, { recursive: true })
    const index = [
      '---',
      'title: Existing',
      'sample: []',
      'scStatuses:',
      '  passed:',
      "    - '2.4.7'",
      '---',
      ''
    ].join('\n')
    await writeFile(join(reportDir, 'index.md'), index)

    await expect(
      writeImportedReport(sampleImport(), { contentDir, slug: 'existing', mode: 'merge' })
    ).rejects.toThrow('disk full')
    expect(await readFile(join(reportDir, 'index.md'), 'utf8')).toBe(index)
    expect(await readdir(reportDir)).toEqual(['index.md'])
  })
})
