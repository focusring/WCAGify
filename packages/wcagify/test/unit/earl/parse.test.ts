import { describe, it, expect } from 'vitest'
import { buildEarl } from '../../../src/earl/generate'
import { parseEarl } from '../../../src/earl/parse'
import type { EarlReportInput, EarlIssueInput } from '../../../src/earl/generate'

function baseReport(overrides: Partial<EarlReportInput> = {}): EarlReportInput {
  return {
    title: 'WCAG audit Example Website',
    language: 'en',
    evaluation: {
      evaluator: 'WCAGify',
      commissioner: 'Example Org',
      target: 'Example Website',
      targetLevel: 'AA',
      targetWcagVersion: '2.2',
      date: '2026-04-20',
      specialRequirements: 'None'
    },
    scope: ['https://example.com'],
    baseline: ['Windows 11 with Chrome and NVDA'],
    technologies: ['HTML', 'CSS'],
    sample: [
      {
        id: 'page-1',
        title: 'Homepage',
        url: 'https://example.com',
        description: 'The homepage'
      },
      {
        id: 'page-2',
        title: 'Contact',
        url: 'https://example.com/contact',
        description: 'Contact page'
      }
    ],
    ...overrides
  }
}

function issue(overrides: Partial<EarlIssueInput> = {}): EarlIssueInput {
  return {
    sc: '2.4.7',
    title: 'Focus style missing',
    sample: 'page-1',
    severity: 'Medium',
    type: 'Design',
    difficulty: 'Low',
    path: '/reports/example/focus',
    ...overrides
  }
}

describe('parseEarl', () => {
  it('round-trips a build+parse and preserves top-level report metadata', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const result = parseEarl(doc)
    expect(result.format).toBe('wcagem')
    expect(result.warnings).toEqual([])
    const { report, issues } = result
    expect(report.title).toBe('WCAG audit Example Website')
    expect(report.evaluation.evaluator).toBe('WCAGify')
    expect(report.evaluation.commissioner).toBe('Example Org')
    expect(report.evaluation.date).toBe('2026-04-20')
    expect(report.evaluation.targetLevel).toBe('AA')
    expect(report.evaluation.targetWcagVersion).toBe('2.2')
    expect(report.evaluation.target).toBe('Example Website')
    expect(report.evaluation.specialRequirements).toBe('None')
    expect(report.scope).toEqual(['https://example.com'])
    expect(report.baseline).toEqual(['Windows 11 with Chrome and NVDA'])
    expect(report.technologies).toEqual(['HTML', 'CSS'])
    expect(issues).toEqual([])
  })

  it('round-trips sample pages with titles + urls', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const { report } = parseEarl(doc)
    expect(report.sample).toEqual([
      {
        id: 'page-1',
        title: 'Homepage',
        url: 'https://example.com',
        description: 'The homepage'
      },
      {
        id: 'page-2',
        title: 'Contact',
        url: 'https://example.com/contact',
        description: 'Contact page'
      }
    ])
  })

  it('round-trips failed issues and attaches them to the right sample by page hint', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [
        issue({ sc: '2.4.7', sample: 'page-1', title: 'Focus style missing' }),
        issue({ sc: '2.1.1', sample: 'page-2', title: 'Keyboard trap' })
      ],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const { issues } = parseEarl(doc)
    expect(issues).toHaveLength(2)
    const focus = issues.find((i) => i.sc === '2.4.7')
    const keyboard = issues.find((i) => i.sc === '2.1.1')
    expect(focus?.sample).toBe('page-1')
    expect(focus?.title).toBe('Focus style missing')
    expect(keyboard?.sample).toBe('page-2')
    expect(keyboard?.title).toBe('Keyboard trap')
  })

  it('round-trips wcagify:severity / type / difficulty metadata', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ severity: 'High', type: 'Technical', difficulty: 'Medium' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const { issues } = parseEarl(doc)
    expect(issues[0]!.severity).toBe('High')
    expect(issues[0]!.type).toBe('Technical')
    expect(issues[0]!.difficulty).toBe('Medium')
  })

  it('round-trips passed / not-present scStatuses', () => {
    const doc = buildEarl({
      report: baseReport({
        scStatuses: { '1.2.1': 'passed', '1.2.2': 'not-present' }
      }),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const { report } = parseEarl(doc)
    expect(report.scStatuses['1.2.1']).toBe('passed')
    expect(report.scStatuses['1.2.2']).toBe('not-present')
  })

  it('warns but defaults when WCAG version is unknown', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    doc.defineScope.wcagVersion = '3.0'
    const { report, warnings } = parseEarl(doc)
    expect(report.evaluation.targetWcagVersion).toBe('2.2')
    expect(warnings.find((w) => w.code === 'unknown-wcag-version')).toBeDefined()
  })

  it('maps cantTell outcome to a failed issue with a warning', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    doc.auditSample.push({
      '@id': '_:assertion_manual',
      '@type': 'Assertion',
      assertedBy: 'audits:x',
      mode: 'earl:manual',
      subject: {
        '@id': '_:assertionSubject_manual',
        '@type': ['TestSubject', 'Website'],
        title: 'Homepage',
        description: 'https://example.com'
      },
      test: {
        '@id': 'WCAG:focus-visible',
        '@type': 'TestCriterion',
        title: '2.4.7: Focus Visible',
        isPartOf: ['WCAG2:2.4.7']
      },
      result: {
        '@type': 'TestResult',
        outcome: { '@id': 'earl:cantTell', '@type': ['OutcomeValue', 'CannotTell'] },
        description: 'Uncertain outcome (on: Homepage)'
      }
    })
    const { issues, warnings } = parseEarl(doc)
    const cantTellIssue = issues.find((i) => i.sc === '2.4.7')
    expect(cantTellIssue?.title).toBe('Uncertain outcome')
    expect(warnings.find((w) => w.code === 'unsupported-outcome')).toBeDefined()
  })

  it('handles date as a {@value: string} wrapped node', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    ;(doc.reportFindings as unknown as { date: unknown }).date = { '@value': '2024-11-02' }
    const { report } = parseEarl(doc)
    expect(report.evaluation.date).toBe('2024-11-02')
  })

  it('falls back to step1b when conformanceTarget is missing', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    ;(doc.defineScope as unknown as { conformanceTarget?: string; step1b: string }).step1b =
      'WAI:WCAG2A-Conformance'
    delete (doc.defineScope as unknown as { conformanceTarget?: string }).conformanceTarget
    const { report } = parseEarl(doc)
    expect(report.evaluation.targetLevel).toBe('A')
  })

  it('warns when page hint does not match any sample', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ sample: 'page-1', title: 'Orphan' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const failed = doc.auditSample.find((a) => a.result.outcome['@id'] === 'earl:failed')!
    failed.result.description = 'Orphan (on: Ghost page)'
    const { warnings, issues } = parseEarl(doc)
    expect(warnings.find((w) => w.code === 'orphan-subject')).toBeDefined()
    expect(issues[0]!.sample).toBe('page-1')
  })

  it('throws for non-object inputs', () => {
    expect(() => parseEarl('not an object')).toThrow()
    expect(() => parseEarl(42)).toThrow()
  })

  it('detects axe-core style ACT documents and extracts assertions', () => {
    const axeDoc = {
      '@context': 'https://www.w3.org/WAI/content-assets/wcag-act-rules/earl-context.json',
      '@graph': [
        {
          '@type': 'Assertor',
          '@id': '#axe',
          name: 'axe-core',
          description: 'Automated accessibility testing engine'
        },
        {
          '@type': 'TestSubject',
          '@id': 'https://example.com/',
          source: 'https://example.com/',
          assertions: [
            {
              '@type': 'Assertion',
              test: {
                '@id': 'image-alt',
                title: 'image-alt',
                isPartOf: 'WCAG2:non-text-content'
              },
              result: { outcome: 'earl:failed', description: 'Image has no alt text' },
              mode: 'earl:automatic'
            },
            {
              '@type': 'Assertion',
              test: {
                '@id': 'document-title',
                title: 'document-title',
                isPartOf: 'WCAG2:page-titled'
              },
              result: { outcome: 'earl:passed' },
              mode: 'earl:automatic'
            }
          ]
        },
        {
          '@type': 'TestSubject',
          '@id': 'https://example.com/about',
          source: 'https://example.com/about',
          assertions: [
            {
              '@type': 'Assertion',
              test: { isPartOf: 'WCAG2:focus-visible' },
              result: { outcome: 'earl:failed', description: 'Focus indicator missing' },
              mode: 'earl:automatic'
            }
          ]
        }
      ]
    }
    const result = parseEarl(axeDoc)
    expect(result.format).toBe('act')
    expect(result.issues).toHaveLength(2)
    const alt = result.issues.find((i) => i.sc === '1.1.1')
    const focus = result.issues.find((i) => i.sc === '2.4.7')
    expect(alt?.sample).toBe('page-1')
    expect(alt?.title).toBe('Image has no alt text')
    expect(focus?.sample).toBe('page-2')
    expect(result.report.scStatuses['2.4.2']).toBe('passed')
    expect(result.report.evaluation.evaluator).toBe('axe-core')
    expect(result.report.sample).toHaveLength(2)
    expect(result.report.sample[0]!.url).toBe('https://example.com/')
    expect(result.warnings.some((w) => w.code === 'unknown-wcag-version')).toBe(true)
    expect(result.warnings.some((w) => w.code === 'unknown-level')).toBe(true)
    expect(result.warnings.some((w) => w.code === 'missing-date')).toBe(true)
  })

  it('resolves slug-based SC references (WCAG2:non-text-content → 1.1.1)', () => {
    const doc = {
      '@context': 'https://www.w3.org/WAI/content-assets/wcag-act-rules/earl-context.json',
      '@graph': [
        {
          '@type': 'TestSubject',
          source: 'https://example.com',
          assertions: [
            {
              '@type': 'Assertion',
              test: { isPartOf: 'WCAG2:non-text-content' },
              result: { outcome: 'earl:failed', description: 'missing alt' },
              mode: 'earl:automatic'
            }
          ]
        }
      ]
    }
    const { issues } = parseEarl(doc)
    expect(issues[0]!.sc).toBe('1.1.1')
  })

  it('handles assertions at @graph top level with subject references', () => {
    const doc = {
      '@graph': [
        {
          '@type': 'TestSubject',
          '@id': 'https://example.com/',
          source: 'https://example.com/',
          title: 'Home'
        },
        {
          '@type': 'Assertion',
          subject: 'https://example.com/',
          test: { isPartOf: 'WCAG2:1.1.1', title: '1.1.1' },
          result: { outcome: 'earl:failed', description: 'broken' },
          mode: 'earl:automatic'
        }
      ]
    }
    const { issues } = parseEarl(doc)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.sample).toBe('page-1')
  })

  it('matches a canonical snapshot', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ sc: '1.1.1', title: 'Missing alt', sample: 'page-1' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const { report, issues, warnings } = parseEarl(doc)
    expect({ report, issues, warnings }).toMatchSnapshot()
  })
})
