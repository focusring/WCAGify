import { describe, it, expect } from 'vitest'
import jsonld from 'jsonld'
import { buildEarlReport, criterionTestId, earlFileName } from '../../../src/earl/build'
import type { EarlAssertion, EarlIssueSource, EarlReportSource } from '../../../src/earl/build'

const report: EarlReportSource = {
  path: '/reports/example',
  title: 'WCAG audit Example Website',
  description: 'Audit of Example Website.',
  language: 'en',
  evaluation: {
    evaluator: 'Jane Evaluator',
    commissioner: 'Example Organisation',
    target: 'Example Website',
    targetLevel: 'AA',
    targetWcagVersion: '2.2',
    date: '2026-01-15',
    specialRequirements: 'None'
  },
  scope: ['https://example.com'],
  outOfScope: ['https://example.com/admin'],
  baseline: ['Windows 11 with Chrome and NVDA', 'macOS with Safari and VoiceOver'],
  technologies: ['HTML', 'CSS', 'JavaScript', 'WAI-ARIA', 'Custom thing'],
  sample: [
    { id: 'page-1', title: 'Homepage', url: 'https://example.com', description: 'Home' },
    { id: 'page-2', title: 'Contact', url: 'https://example.com/contact', description: 'Form' }
  ],
  scStatuses: { passed: ['1.1.1', '1.3.1'], 'not-present': ['1.2.1'] },
  body: { type: 'minimark', value: [['p', {}, 'Executive summary.']] }
}

const issues: EarlIssueSource[] = [
  {
    path: '/reports/example/no-keyboard',
    title: 'Dropdown not keyboard operable',
    sc: '2.1.1',
    severity: 'High',
    type: 'Technical',
    sample: 'page-2',
    body: { type: 'minimark', value: [['p', {}, 'The dropdown cannot be reached.']] }
  },
  {
    path: '/reports/example/focus-style',
    title: 'Focus style missing',
    sc: '2.4.7',
    severity: 'Medium',
    sample: 'page-1',
    description: 'No visible focus.'
  },
  {
    path: '/reports/example/second-keyboard',
    title: 'Second keyboard issue',
    sc: '2.1.1',
    sample: 'unknown-page'
  },
  { path: '/reports/example/tip', title: 'A tip', sc: 'none', sample: 'page-1' }
]

function evaluationOf(earl: ReturnType<typeof buildEarlReport>) {
  return earl['@graph'][0] as Record<string, unknown> & { auditResult: EarlAssertion[] }
}

describe('buildEarlReport', () => {
  const earl = buildEarlReport(report, issues, {
    baseUrl: 'https://audit.example/',
    version: '1.2.3'
  })
  const evaluation = evaluationOf(earl)

  it('produces an evaluation and an evaluator node', () => {
    expect(earl['@graph']).toHaveLength(2)
    expect(evaluation.type).toBe('Evaluation')
    expect(evaluation.id).toBe('https://audit.example/reports/example')
    expect(evaluation.publisher).toBe('https://github.com/focusring/WCAGify/releases/tag/v1.2.3')
    expect(evaluation.lang).toBe('en')
    expect(evaluation.language).toBe('en')
    expect(evaluation.title).toBe(report.title)
    expect(evaluation.summary).toBe('Executive summary.')
    expect(evaluation.date).toBe('2026-01-15')
    expect(evaluation.commissioner).toBe('Example Organisation')
    expect(evaluation.creator).toBe('_:evaluator')
    expect(earl['@graph'][1]).toMatchObject({
      id: '_:evaluator',
      type: 'Person',
      name: 'Jane Evaluator'
    })
  })

  it('uses the WCAG namespace of the evaluated version', () => {
    expect(earl['@context'].WCAG2).toBe('http://www.w3.org/TR/WCAG22/#')
    expect(
      buildEarlReport(
        { ...report, evaluation: { ...report.evaluation, targetWcagVersion: '2.1' } },
        []
      )['@context'].WCAG2
    ).toBe('http://www.w3.org/TR/WCAG21/#')
  })

  it('documents the evaluation scope (WCAG-EM Step 1)', () => {
    expect(evaluation.evaluationScope).toEqual({
      type: 'EvaluationScope',
      conformanceTarget: 'wai:WCAG2AA-Conformance',
      accessibilitySupportBaseline:
        'Windows 11 with Chrome and NVDA\nmacOS with Safari and VoiceOver',
      additionalEvalRequirement: 'None',
      website: {
        type: ['TestSubject', 'WebSite'],
        id: '_:website',
        siteName: 'Example Website',
        siteScope: 'https://example.com\n\nExcluded: https://example.com/admin'
      }
    })
  })

  it('lists technologies relied upon with known IRIs', () => {
    expect(evaluation.reliedUponTechnology).toEqual([
      { type: 'Technology', id: 'http://www.w3.org/TR/html5/', title: 'HTML' },
      { type: 'Technology', id: 'http://www.w3.org/Style/CSS/specs/', title: 'CSS' },
      { type: 'Technology', id: 'https://tc39.es/ecma262/', title: 'JavaScript' },
      { type: 'Technology', id: 'http://www.w3.org/TR/wai-aria/', title: 'WAI-ARIA' },
      { type: 'Technology', title: 'Custom thing' }
    ])
  })

  it('lists the sample set as structured sample web pages', () => {
    expect(evaluation.structuredSample).toEqual({
      type: 'Sample',
      webpage: [
        {
          type: ['TestSubject', 'WebPage'],
          id: '_:sample-page-1',
          title: 'Homepage',
          description: 'Home',
          source: 'https://example.com',
          tested: true
        },
        {
          type: ['TestSubject', 'WebPage'],
          id: '_:sample-page-2',
          title: 'Contact',
          description: 'Form',
          source: 'https://example.com/contact',
          tested: true
        }
      ]
    })
    expect(evaluation.randomSample).toEqual({ type: 'Sample', webpage: [] })
  })

  it('asserts every criterion at the target level, in order', () => {
    const tests = evaluation.auditResult.map((a) => a.test)
    expect(tests).toHaveLength(55)
    expect(tests[0]).toBe('WCAG2:non-text-content')
    expect(tests.at(-1)).toBe('WCAG2:status-messages')
    expect(tests).not.toContain('WCAG2:parsing')
    for (const assertion of evaluation.auditResult) {
      expect(assertion).toMatchObject({
        type: 'Assertion',
        assertedBy: '_:evaluator',
        subject: '_:website',
        mode: 'earl:manual'
      })
    }
  })

  it('maps outcomes: failed for issues, passed and inapplicable for recorded outcomes, untested otherwise', () => {
    const byTest = new Map(evaluation.auditResult.map((a) => [a.test, a]))
    expect(byTest.get('WCAG2:keyboard')!.result.outcome).toBe('earl:failed')
    expect(byTest.get('WCAG2:focus-visible')!.result.outcome).toBe('earl:failed')
    expect(byTest.get('WCAG2:non-text-content')!.result.outcome).toBe('earl:passed')
    expect(byTest.get('WCAG2:audio-only-and-video-only-prerecorded')!.result.outcome).toBe(
      'earl:inapplicable'
    )
    expect(byTest.get('WCAG2:page-titled')!.result.outcome).toBe('earl:untested')
  })

  it('turns each issue into a part of its criterion assertion against its sample', () => {
    const keyboard = evaluation.auditResult.find((a) => a.test === 'WCAG2:keyboard')!
    expect(keyboard.result.description).toBe(
      'Dropdown not keyboard operable\nSecond keyboard issue'
    )
    expect(keyboard.hasPart).toHaveLength(2)
    expect(keyboard.hasPart![0]).toEqual({
      type: 'Assertion',
      id: 'https://audit.example/reports/example#issue-reports-example-no-keyboard',
      test: 'WCAG2:keyboard',
      assertedBy: '_:evaluator',
      subject: ['_:sample-page-2'],
      mode: 'earl:manual',
      multiPage: false,
      result: {
        type: 'TestResult',
        outcome: 'earl:failed',
        title: 'Dropdown not keyboard operable',
        description: 'The dropdown cannot be reached.',
        severity: 'High',
        issueType: 'Technical'
      }
    })
    expect(keyboard.hasPart![1]!.subject).toEqual(['_:website'])

    const focus = evaluation.auditResult.find((a) => a.test === 'WCAG2:focus-visible')!
    expect(focus.hasPart![0]!.result.description).toBe('No visible focus.')
    expect(focus.hasPart![0]!.result.severity).toBe('Medium')
  })

  it('ignores tips and keeps passed criteria without parts', () => {
    const parts = evaluation.auditResult.flatMap((a) => a.hasPart ?? [])
    expect(parts).toHaveLength(3)
    const nonText = evaluation.auditResult.find((a) => a.test === 'WCAG2:non-text-content')!
    expect(nonText.hasPart).toEqual([])
    expect(nonText.result.description).toBeUndefined()
  })

  it('includes the scorecard', () => {
    expect(evaluation.scorecard).toEqual({ conforming: 3, failed: 2, notTested: 50, total: 55 })
    expect(evaluation.wcagVersion).toBe('2.2')
  })

  it('adds criteria outside the target level when they have issues', () => {
    const withAaa = buildEarlReport(report, [
      { title: 'Sign language missing', sc: '1.2.6', sample: 'page-1' }
    ])
    const tests = evaluationOf(withAaa).auditResult.map((a) => a.test)
    expect(tests).toHaveLength(56)
    expect(tests).toContain('WCAG2:sign-language-prerecorded')
  })

  it('marks samples as untested and uses blank ids without a base URL', () => {
    const minimal = buildEarlReport(
      { ...report, path: undefined, scStatuses: undefined, body: null },
      []
    )
    const ev = evaluationOf(minimal)
    expect(ev.id).toBe('_:evaluation')
    expect(ev.publisher).toBe('https://github.com/focusring/WCAGify')
    expect(ev.summary).toBe('Audit of Example Website.')
    const pages = (ev.structuredSample as { webpage: { tested: boolean }[] }).webpage
    expect(pages.every((page) => page.tested === false)).toBe(true)
    expect(ev.auditResult.every((a) => a.result.outcome === 'earl:untested')).toBe(true)
  })

  it('uses WCAG 2.0 anchors for WCAG 2.0 reports', () => {
    const wcag20 = buildEarlReport(
      { ...report, evaluation: { ...report.evaluation, targetWcagVersion: '2.0' } },
      issues
    )
    expect(wcag20['@context'].WCAG2).toBe('http://www.w3.org/TR/WCAG20/#')
    const tests = evaluationOf(wcag20).auditResult.map((a) => a.test)
    expect(tests).toHaveLength(38)
    expect(tests[0]).toBe('WCAG2:text-equiv-all')
    expect(tests).toContain('WCAG2:keyboard-operation-keyboard-operable')
    expect(tests).toContain('WCAG2:ensure-compat-parses')
  })

  it('expands to valid JSON-LD with EARL IRIs', async () => {
    const expanded = (await jsonld.expand(earl as never)) as Record<string, unknown>[]
    expect(expanded).toHaveLength(2)
    const ev = expanded[0]!
    expect(ev['@type']).toEqual(['http://www.w3.org/TR/WCAG-EM/#Evaluation'])
    expect(ev['http://purl.org/dc/terms/title']).toEqual([{ '@value': report.title }])
    const assertions = ev['http://www.w3.org/TR/WCAG-EM/#step4'] as Record<string, unknown>[]
    expect(assertions).toHaveLength(55)
    const first = assertions[0]!
    expect(first['@type']).toEqual(['http://www.w3.org/ns/earl#Assertion'])
    expect(first['http://www.w3.org/ns/earl#test']).toEqual([
      { '@id': 'http://www.w3.org/TR/WCAG22/#non-text-content' }
    ])
    expect(first['http://www.w3.org/ns/earl#subject']).toEqual([{ '@id': '_:website' }])
    const result = (first['http://www.w3.org/ns/earl#result'] as Record<string, unknown>[])[0]!
    expect(result['http://www.w3.org/ns/earl#outcome']).toEqual([
      { '@id': 'http://www.w3.org/ns/earl#passed' }
    ])
    const scope = (ev['http://www.w3.org/TR/WCAG-EM/#step1'] as Record<string, unknown>[])[0]!
    expect(scope['http://www.w3.org/TR/WCAG-EM/#step1b']).toEqual([
      { '@id': 'http://www.w3.org/WAI/WCAG2AA-Conformance' }
    ])
    const person = expanded[1]!
    expect(person['@type']).toEqual(['http://xmlns.com/foaf/0.1/Person'])
    expect(person['http://xmlns.com/foaf/0.1/name']).toEqual([{ '@value': 'Jane Evaluator' }])
  })
})

describe('criterionTestId', () => {
  it('keeps 2.1 and 2.2 anchors and maps 2.0 anchors', () => {
    expect(criterionTestId('non-text-content', '2.2')).toBe('WCAG2:non-text-content')
    expect(criterionTestId('non-text-content', '2.1')).toBe('WCAG2:non-text-content')
    expect(criterionTestId('non-text-content', '2.0')).toBe('WCAG2:text-equiv-all')
    expect(criterionTestId('unknown-slug', '2.0')).toBe('WCAG2:unknown-slug')
  })
})

describe('earlFileName', () => {
  it('slugifies the title', () => {
    expect(earlFileName('WCAG audit Example Website')).toBe(
      'wcag-audit-example-website-earl.jsonld'
    )
    expect(earlFileName('  ')).toBe('report-earl.jsonld')
  })
})
