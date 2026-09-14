import { mkdtemp, readFile, readdir, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { writeImportedReport, mergeFrontmatter } from '../../../src/earl/write'
import type { EarlImport } from '../../../src/earl/parse'

function sampleImport(): EarlImport {
  return {
    report: {
      title: 'Imported: Example',
      description: '',
      language: 'en',
      evaluation: {
        evaluator: 'Eva',
        commissioner: 'Com',
        target: 'Example',
        targetLevel: 'AA',
        targetWcagVersion: '2.2',
        date: '2026-03-01',
        specialRequirements: ''
      },
      scope: ['https://example.com'],
      outOfScope: [],
      baseline: ['Chrome + NVDA'],
      technologies: ['HTML'],
      sample: [
        { id: 'home', title: 'Home', url: 'https://example.com', description: '' },
        { id: 'contact', title: 'Contact', url: 'https://example.com/contact', description: '' }
      ],
      scStatuses: { passed: ['1.3.1', '1.1.1'], 'not-present': ['1.2.1'] },
      summary: 'Summary text.'
    },
    issues: [
      {
        title: 'Missing alt: text',
        sc: '1.1.1',
        sample: 'home',
        body: 'Body one.',
        severity: 'High'
      },
      { title: 'Missing alt: text', sc: '1.1.1', sample: 'contact', body: 'Body two.' }
    ],
    warnings: ['A warning'],
    stats: { assertions: 3, criteriaWithOutcome: 3, unknownTests: [] }
  }
}

describe('writeImportedReport', () => {
  let contentDir: string

  beforeEach(async () => {
    contentDir = await mkdtemp(join(tmpdir(), 'wcagify-earl-'))
  })

  afterEach(async () => {
    await rm(contentDir, { recursive: true, force: true })
  })

  it('creates a report directory with index.md and one file per issue', async () => {
    const result = await writeImportedReport(sampleImport(), { contentDir, slug: 'imported' })
    expect(result).toMatchObject({
      mode: 'create',
      slug: 'imported',
      reportDir: 'reports/imported',
      issuesWritten: 2,
      warnings: ['A warning'],
      updated: []
    })
    expect(result.created).toEqual([
      'reports/imported/index.md',
      'reports/imported/missing-alt-text.md',
      'reports/imported/missing-alt-text-2.md'
    ])

    const index = await readFile(join(contentDir, 'reports/imported/index.md'), 'utf8')
    expect(index.startsWith('---\n')).toBe(true)
    expect(index.endsWith('---\n\nSummary text.\n')).toBe(true)
    const frontmatter = parseYaml(index.split('---')[1]!) as Record<string, unknown>
    expect(frontmatter.title).toBe('Imported: Example')
    expect(frontmatter.evaluation).toEqual(sampleImport().report.evaluation)
    expect(frontmatter.scStatuses).toEqual({ passed: ['1.1.1', '1.3.1'], 'not-present': ['1.2.1'] })
    expect(frontmatter).not.toHaveProperty('outOfScope')
    expect((frontmatter.sample as unknown[]).length).toBe(2)

    const issue = await readFile(join(contentDir, 'reports/imported/missing-alt-text.md'), 'utf8')
    expect(issue).toBe(
      "---\ntitle: 'Missing alt: text'\nsc: 1.1.1\nseverity: High\nsample: home\n---\n\nBody one.\n"
    )
  })

  it('refuses to create over an existing report', async () => {
    await writeImportedReport(sampleImport(), { contentDir, slug: 'imported' })
    await expect(
      writeImportedReport(sampleImport(), { contentDir, slug: 'imported' })
    ).rejects.toThrow('already exists')
  })

  it('rejects invalid slugs', async () => {
    await expect(
      writeImportedReport(sampleImport(), { contentDir, slug: 'Not Valid' })
    ).rejects.toThrow('Invalid slug')
  })

  it('merges outcomes, samples and issues into an existing report', async () => {
    const reportDir = join(contentDir, 'reports/existing')
    await mkdir(reportDir, { recursive: true })
    await writeFile(
      join(reportDir, 'index.md'),
      [
        '---',
        'title: Existing report',
        'language: nl',
        'evaluation:',
        '  evaluator: Someone',
        '  commissioner: Client',
        '  target: Existing',
        '  targetLevel: AA',
        "  targetWcagVersion: '2.2'",
        '  date: 2026-01-01',
        '  specialRequirements: None',
        'scope:',
        '  - https://existing.example',
        'baseline:',
        '  - Chrome + NVDA',
        'technologies:',
        '  - HTML',
        'sample:',
        '  - id: home',
        '    title: Home',
        '    url: https://existing.example',
        '    description: Start',
        'scStatuses:',
        '  passed:',
        "    - '1.1.1'",
        "    - '2.4.2'",
        '  not-present:',
        "    - '1.3.1'",
        '---',
        '',
        'Existing summary.',
        ''
      ].join('\n')
    )
    await writeFile(
      join(reportDir, 'missing-alt-text.md'),
      '---\ntitle: x\nsc: 1.1.1\nsample: home\n---\n'
    )

    const result = await writeImportedReport(sampleImport(), {
      contentDir,
      slug: 'existing',
      mode: 'merge'
    })
    expect(result.updated).toEqual(['reports/existing/index.md'])
    expect(result.created).toEqual([
      'reports/existing/missing-alt-text-2.md',
      'reports/existing/missing-alt-text-3.md'
    ])

    const index = await readFile(join(reportDir, 'index.md'), 'utf8')
    const frontmatter = parseYaml(index.split('---')[1]!) as Record<string, unknown>
    expect(frontmatter.title).toBe('Existing report')
    expect(frontmatter.language).toBe('nl')
    expect(frontmatter.scStatuses).toEqual({
      passed: ['1.3.1', '2.4.2'],
      'not-present': ['1.2.1']
    })
    expect((frontmatter.sample as { id: string }[]).map((page) => page.id)).toEqual([
      'home',
      'contact'
    ])
    expect(index.endsWith('---\n\nExisting summary.\n')).toBe(true)
    expect((await readdir(reportDir)).sort()).toEqual([
      'index.md',
      'missing-alt-text-2.md',
      'missing-alt-text-3.md',
      'missing-alt-text.md'
    ])
  })

  it('refuses to merge into a missing report', async () => {
    await expect(
      writeImportedReport(sampleImport(), { contentDir, slug: 'nope', mode: 'merge' })
    ).rejects.toThrow('not found')
  })
})

describe('mergeFrontmatter', () => {
  it('removes recorded passes for criteria that now have issues', () => {
    const merged = mergeFrontmatter(
      { scStatuses: { passed: ['1.1.1', '2.1.1'] }, sample: [] },
      sampleImport()
    )
    expect(merged.scStatuses).toEqual({ passed: ['1.3.1', '2.1.1'], 'not-present': ['1.2.1'] })
  })
})
