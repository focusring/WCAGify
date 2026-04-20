import { describe, it, expect } from 'vitest'
import { buildEarl } from '../../../src/earl/generate'
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

describe('buildEarl', () => {
  it('emits a WCAG-EM Evaluation with the expected top-level sections', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    expect(doc['@type']).toBe('Evaluation')
    expect(doc['@language']).toBe('en')
    expect(doc.defineScope).toBeDefined()
    expect(doc.exploreTarget).toBeDefined()
    expect(doc.selectSample).toBeDefined()
    expect(doc.auditSample).toBeInstanceOf(Array)
    expect(doc.reportFindings).toBeDefined()
  })

  it('embeds a usable inline @context that includes WCAG, WCAG2 and earl prefixes', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const ctx = doc['@context'] as Record<string, unknown>
    expect(ctx.earl).toBe('http://www.w3.org/ns/earl#')
    expect(ctx.WCAG).toBe('http://www.w3.org/TR/WCAG/#')
    expect(ctx.WCAG2).toBe('https://www.w3.org/TR/WCAG22/#')
    expect(ctx.Evaluation).toBe('wcagem:procedure')
  })

  it('puts the evaluator and commissioner in reportFindings with the report date', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    expect(doc.reportFindings.evaluator).toBe('WCAGify')
    expect(doc.reportFindings.commissioner).toBe('Example Org')
    expect(doc.reportFindings.date).toBe('2026-04-20')
    expect(doc.reportFindings.title).toBe('WCAG audit Example Website')
  })

  it('populates defineScope with conformance target, baseline and WCAG version', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    expect(doc.defineScope.conformanceTarget).toBe('AA')
    expect(doc.defineScope.wcagVersion).toBe('2.2')
    expect(doc.defineScope.accessibilitySupportBaseline).toContain('Windows 11')
    expect(doc.defineScope.scope.title).toBe('Example Website')
  })

  it('fills technologiesReliedUpon as objects with title keys', () => {
    const doc = buildEarl({
      report: baseReport({ technologies: ['HTML', 'WAI-ARIA'] }),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    expect(doc.exploreTarget.technologiesReliedUpon).toEqual([
      { title: 'HTML' },
      { title: 'WAI-ARIA' }
    ])
  })

  it('emits one structuredSample per sample page with TestSubject + Webpage types', () => {
    const doc = buildEarl({
      report: baseReport({
        sample: [
          { id: 'page-1', title: 'Home', url: 'https://example.com', description: 'home' },
          { id: 'page-2', title: 'Contact', url: 'https://example.com/contact', description: 'c' }
        ]
      }),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    expect(doc.selectSample.structuredSample).toHaveLength(2)
    expect(doc.selectSample.structuredSample[0]!['@type']).toEqual(['TestSubject', 'Webpage'])
    expect(doc.selectSample.structuredSample[0]!['@id']).toBe('https://example.com')
    expect(doc.selectSample.structuredSample[1]!['@id']).toBe('https://example.com/contact')
  })

  it('routes an issue to the subject whose sample id matches', () => {
    const doc = buildEarl({
      report: baseReport({
        sample: [
          { id: 'page-1', title: 'Home', url: 'https://example.com', description: '' },
          { id: 'page-2', title: 'Contact', url: 'https://example.com/contact', description: '' }
        ]
      }),
      issues: [issue({ sample: 'page-2', sc: '1.1.1', title: 'Missing alt' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const failed = doc.auditSample.find((a) => a.test.isPartOf[0] === 'WCAG2:1.1.1')
    expect(failed?.subject.title).toBe('Contact')
    expect(failed?.result.description).toContain('Missing alt')
    expect(failed?.result.description).toContain('Contact')
  })

  it('emits failed / passed / inapplicable outcomes and omits default untested', () => {
    const doc = buildEarl({
      report: baseReport({
        scStatuses: { '1.2.1': 'passed', '1.2.2': 'not-present' }
      }),
      issues: [issue({ sc: '1.1.1', title: 'Missing alt' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const outcomes = new Set(doc.auditSample.map((a) => a.result.outcome['@id']))
    expect(outcomes.has('earl:failed')).toBe(true)
    expect(outcomes.has('earl:passed')).toBe(true)
    expect(outcomes.has('earl:inapplicable')).toBe(true)
    expect(outcomes.has('earl:untested')).toBe(false)
  })

  it('types assertion subjects as Website so the RT scope cell binds to them', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue()],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const a = doc.auditSample[0]!
    expect(a.subject['@type']).toEqual(['TestSubject', 'Website'])
    expect(doc.selectSample.structuredSample[0]!['@type']).toEqual(['TestSubject', 'Webpage'])
  })

  it('references tests using WCAG:<slug> for known SCs', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ sc: '2.4.7', title: 'Focus missing' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const focus = doc.auditSample.find((a) => a.result.outcome['@id'] === 'earl:failed')
    expect(focus?.test['@id']).toBe('WCAG:focus-visible')
    expect(focus?.test.isPartOf[0]).toBe('WCAG2:2.4.7')
  })

  it('excludes AAA criteria when target level is AA from scStatus coverage', () => {
    const doc = buildEarl({
      report: baseReport({
        scStatuses: { '1.4.3': 'passed', '1.4.6': 'passed' }
      }),
      issues: [],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const scs = doc.auditSample.map((a) => a.test.isPartOf[0])
    expect(scs).toContain('WCAG2:1.4.3')
    expect(scs).not.toContain('WCAG2:1.4.6')
  })

  it('preserves severity/type/difficulty under wcagify: namespace', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ severity: 'High', type: 'Technical', difficulty: 'Medium' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const failed = doc.auditSample.find((a) => a.result.outcome['@id'] === 'earl:failed')
    expect(failed?.['wcagify:severity']).toBe('High')
    expect(failed?.['wcagify:type']).toBe('Technical')
    expect(failed?.['wcagify:difficulty']).toBe('Medium')
  })

  it('falls back to a blank-node test id when sc-to-slug lacks an entry', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ sc: '9.9.9', title: 'Bogus SC' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const bogus = doc.auditSample.find((a) => a.test.isPartOf[0] === 'WCAG2:9.9.9')
    expect(bogus?.test['@id']).toBe('_:test_9.9.9')
    expect(bogus?.test.title).toBe('9.9.9')
  })

  it('skips tips (sc=none)', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ sc: 'none', title: 'Tip only' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    expect(doc.auditSample.find((a) => a.result.description === 'Tip only')).toBeUndefined()
  })

  it('attaches unrouted issues to the first subject with a sampleHint', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ sample: 'ghost-page', sc: '1.1.1', title: 'Orphan' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    const orphan = doc.auditSample.find((a) => a.result.description?.startsWith('Orphan'))
    expect(orphan?.['wcagify:sampleHint']).toBe('ghost-page')
    expect(orphan?.subject.title).toBe('Homepage')
    expect(orphan?.subject['@id']).toMatch(/^_:assertionSubject_\d+$/)
  })

  it('matches a canonical snapshot', () => {
    const doc = buildEarl({
      report: baseReport(),
      issues: [issue({ sc: '1.1.1', title: 'Missing alt', sample: 'page-1' })],
      slug: 'example',
      baseUrl: 'https://audits.test'
    })
    expect(doc).toMatchSnapshot()
  })
})
