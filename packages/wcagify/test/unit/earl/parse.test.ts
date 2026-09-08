import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parseEarlReport, criterionFromIri, outcomeStatus } from '../../../src/earl/parse'
import { buildEarlReport } from '../../../src/earl/build'

const fixturesDir = join(__dirname, '../../fixtures/earl')
function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), 'utf8'))
}

describe('criterionFromIri', () => {
  it('reads WCAG 2.1 and 2.2 specification anchors', () => {
    expect(criterionFromIri('http://www.w3.org/TR/WCAG22/#non-text-content')).toEqual({
      sc: '1.1.1',
      version: '2.2'
    })
    expect(criterionFromIri('https://www.w3.org/TR/WCAG21/#focus-visible')).toEqual({
      sc: '2.4.7',
      version: '2.1'
    })
  })

  it('reads WCAG 2.0 anchors', () => {
    expect(criterionFromIri('http://www.w3.org/TR/WCAG20/#text-equiv-all')).toEqual({
      sc: '1.1.1',
      version: '2.0'
    })
    expect(criterionFromIri('https://www.w3.org/TR/WCAG20/#ensure-compat-rsv')).toEqual({
      sc: '4.1.2',
      version: '2.0'
    })
  })

  it('reads quickref and Understanding URLs', () => {
    expect(criterionFromIri('https://www.w3.org/WAI/WCAG22/quickref/#target-size-minimum')).toEqual(
      {
        sc: '2.5.8',
        version: '2.2'
      }
    )
    expect(criterionFromIri('https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html')).toEqual({
      sc: '2.1.1',
      version: '2.1'
    })
  })

  it('reads anchors that changed between versions', () => {
    expect(criterionFromIri('http://www.w3.org/TR/WCAG21/#target-size')).toEqual({
      sc: '2.5.5',
      version: '2.1'
    })
    expect(criterionFromIri('http://www.w3.org/TR/WCAG22/#target-size-enhanced')).toEqual({
      sc: '2.5.5',
      version: '2.2'
    })
  })

  it('ignores IRIs that are not success criteria', () => {
    expect(criterionFromIri('http://www.w3.org/TR/WCAG22/#dfn-relied-upon')).toBeUndefined()
    expect(criterionFromIri('https://dequeuniversity.com/rules/axe/3.2/aria-roles')).toBeUndefined()
  })
})

describe('outcomeStatus', () => {
  it('maps EARL outcomes including legacy spellings', () => {
    expect(outcomeStatus('http://www.w3.org/ns/earl#passed')).toBe('passed')
    expect(outcomeStatus('http://www.w3.org/ns/earl#Pass')).toBe('passed')
    expect(outcomeStatus('http://www.w3.org/ns/earl#failed')).toBe('failed')
    expect(outcomeStatus('http://www.w3.org/ns/earl#inapplicable')).toBe('not-present')
    expect(outcomeStatus('http://www.w3.org/ns/earl#NotApplicable')).toBe('not-present')
    expect(outcomeStatus('http://www.w3.org/ns/earl#untested')).toBe('not-tested')
    expect(outcomeStatus('http://www.w3.org/ns/earl#cantTell')).toBe('cant-tell')
    expect(outcomeStatus(undefined)).toBeUndefined()
    expect(outcomeStatus('http://example.com/other')).toBeUndefined()
  })
})

describe('parseEarlReport', () => {
  it('rejects non-objects', async () => {
    await expect(parseEarlReport(42)).rejects.toThrow('JSON object')
  })

  describe('WCAGify export', () => {
    it('round-trips a WCAGify export', async () => {
      const imported = await parseEarlReport(fixture('wcagify-example.jsonld'))
      expect(imported.warnings).toEqual([])
      expect(imported.report).toMatchObject({
        title: 'WCAG audit Example Website',
        language: 'en',
        evaluation: {
          evaluator: 'WCAGify',
          commissioner: 'Example Organisation',
          target: 'Example Website',
          targetLevel: 'AA',
          targetWcagVersion: '2.2',
          date: '2025-01-15',
          specialRequirements: 'None'
        },
        scope: [
          'https://example.com',
          'https://example.com/contact',
          'https://example.com/products'
        ],
        outOfScope: ['https://example.com/admin'],
        baseline: [
          'Windows 11 with Chrome and NVDA',
          'macOS with Safari and VoiceOver',
          'Android with Chrome and TalkBack'
        ],
        technologies: ['HTML', 'CSS', 'JavaScript', 'WAI-ARIA'],
        summary: 'This is an example report for a WCAG accessibility audit of Example Website.'
      })
      expect(imported.report.sample.map((page) => page.id)).toEqual(['page-1', 'page-2', 'page-3'])
      expect(imported.report.sample[0]).toEqual({
        id: 'page-1',
        title: 'Homepage',
        url: 'https://example.com',
        description: 'The homepage of the website'
      })
      expect(imported.report.scStatuses.passed).toHaveLength(38)
      expect(imported.report.scStatuses['not-present']).toHaveLength(15)
      expect(imported.report.scStatuses.passed).not.toContain('2.1.1')
      expect(imported.issues).toHaveLength(2)
      expect(imported.issues.map((issue) => [issue.sc, issue.sample])).toEqual([
        ['2.1.1', 'page-2'],
        ['2.4.7', 'page-1']
      ])
      expect(imported.issues[0]).toMatchObject({
        title: 'Not all functionality is reachable with the keyboard',
        type: 'Content'
      })
      expect(imported.issues[0]!.body).toContain('#### Recommendation')
      expect(imported.issues[1]!.severity).toBe('Medium')
      expect(imported.stats).toEqual({ assertions: 57, criteriaWithOutcome: 55, unknownTests: [] })
    })

    it('round-trips a build result in memory, including product-level issues', async () => {
      const earl = buildEarlReport(
        {
          path: '/reports/rt',
          title: 'Round trip',
          language: 'nl',
          evaluation: {
            evaluator: 'Eva',
            commissioner: 'Com',
            target: 'Product',
            targetLevel: 'A',
            targetWcagVersion: '2.1',
            date: '2026-02-02',
            specialRequirements: ''
          },
          scope: ['https://rt.example'],
          baseline: ['Chrome + NVDA'],
          technologies: ['HTML'],
          sample: [{ id: 'home', title: 'Home', url: 'https://rt.example', description: '' }],
          scStatuses: { passed: ['1.1.1'] }
        },
        [
          {
            title: 'Product-wide issue',
            sc: '2.4.1',
            sample: 'missing-sample',
            body: 'Everywhere.'
          }
        ]
      )
      const imported = await parseEarlReport(earl)
      expect(imported.report.language).toBe('nl')
      expect(imported.report.evaluation.targetLevel).toBe('A')
      expect(imported.report.evaluation.targetWcagVersion).toBe('2.1')
      expect(imported.report.scStatuses.passed).toEqual(['1.1.1'])
      expect(imported.issues).toEqual([
        { title: 'Product-wide issue', sc: '2.4.1', sample: 'product', body: 'Everywhere.' }
      ])
      expect(imported.report.sample.map((page) => page.id)).toEqual(['home', 'product'])
      expect(imported.report.sample[1]).toMatchObject({
        title: 'Product',
        url: 'https://rt.example'
      })
    })
  })

  describe('W3C WCAG-EM Report Tool export', () => {
    it('reads the evaluation, samples and page-level findings', async () => {
      const imported = await parseEarlReport(fixture('report-tool-v3.json'))
      expect(imported.report).toMatchObject({
        title: 'Report for Website Name',
        evaluation: {
          evaluator: 'External Evaluator',
          commissioner: 'External Commissioner',
          target: 'Website Name',
          targetLevel: 'AA',
          targetWcagVersion: '2.1',
          date: '2019-09-05',
          specialRequirements: 'None'
        },
        scope: ['All pages on https://website-name.org'],
        baseline: ['Browsers Latest version'],
        technologies: ['HTML5', 'CSS', 'ECMAScript 5', 'SVG'],
        summary: 'There have been found some violations.'
      })
      expect(imported.report.sample.map((page) => page.id)).toEqual([
        'homepage',
        'contact-form',
        'search-page',
        'random-news-page',
        'random-search-result-page',
        'product'
      ])
      expect(imported.report.sample[1]).toMatchObject({
        title: 'Contact form',
        url: 'https://website-name.org/contact-us/'
      })
      // Criterion 1.1.1 fails on a structured page; 1.3.1 fails at site level without parts.
      expect(imported.issues.map((issue) => [issue.sc, issue.sample])).toEqual([
        ['1.1.1', 'contact-form'],
        ['1.3.1', 'product']
      ])
      expect(imported.issues[0]!.body).toBe('Found a violation ...')
      expect(imported.report.scStatuses.passed).toContain('1.2.1')
      expect(imported.report.scStatuses.passed).not.toContain('1.1.1')
      expect(imported.warnings.some((w) => w.includes('cannot tell'))).toBe(true)
    })
  })

  describe('axe-core EARL', () => {
    it('maps rules to criteria through isPartOf and pages through their source URL', async () => {
      const imported = await parseEarlReport(fixture('axe.json'))
      expect(imported.warnings).toContain(
        'No WCAG-EM evaluation metadata found; report details use placeholders.'
      )
      expect(imported.report.evaluation.targetWcagVersion).toBe('2.0')
      expect(imported.report.evaluation.targetLevel).toBe('AA')
      expect(imported.report.sample.map((page) => page.url)).toEqual([
        'https://website-name.org/search/',
        'https://website-name.org',
        'https://website-name.org/contact-us/'
      ])
      expect(imported.issues.map((issue) => [issue.sc, issue.title, issue.sample])).toEqual([
        ['1.3.1', 'aria-required-children', 'website-name-org-search'],
        ['4.1.2', 'aria-roles', 'website-name-org'],
        ['4.1.2', 'button-name', 'website-name-org-contact-us'],
        ['1.3.1', 'definition-list', 'website-name-org-search']
      ])
      expect(imported.issues[0]!.body).toBe(
        'Test: aria-required-children (https://dequeuniversity.com/rules/axe/3.2/aria-required-children?application=axeAPI)'
      )
      expect(imported.report.scStatuses.passed).toEqual([])
      expect(imported.stats.unknownTests).toEqual([])
    })
  })

  describe('plain EARL assertions', () => {
    it('reads assertions with URL subjects and a foaf evaluator', async () => {
      const imported = await parseEarlReport(fixture('simple.json'))
      expect(imported.report.evaluation.evaluator).toBe('External Evaluator')
      expect(imported.report.evaluation.targetWcagVersion).toBe('2.1')
      expect(imported.report.sample.map((page) => page.url)).toEqual([
        'https://website-name.org/contact-us/',
        'https://website-name.org/search/?search=some-random-page'
      ])
      expect(imported.issues.map((issue) => issue.sc)).toEqual(['1.3.1', '1.3.2'])
      expect(imported.issues[0]!.body).toContain('heading like text')
      expect(imported.report.scStatuses.passed).toEqual(['1.1.1'])
    })
  })

  it('reports unknown tests and cannot-tell outcomes as warnings', async () => {
    const imported = await parseEarlReport({
      '@context': { earl: 'http://www.w3.org/ns/earl#' },
      '@graph': [
        {
          '@type': 'earl:Assertion',
          'earl:test': { '@id': 'https://example.com/rules/custom' },
          'earl:subject': { '@id': 'https://example.com/' },
          'earl:result': { '@type': 'earl:TestResult', 'earl:outcome': { '@id': 'earl:failed' } }
        },
        {
          '@type': 'earl:Assertion',
          'earl:test': { '@id': 'http://www.w3.org/TR/WCAG22/#page-titled' },
          'earl:subject': { '@id': 'https://example.com/' },
          'earl:result': { '@type': 'earl:TestResult', 'earl:outcome': { '@id': 'earl:cantTell' } }
        }
      ]
    })
    expect(imported.stats.unknownTests).toEqual(['https://example.com/rules/custom'])
    expect(imported.warnings).toEqual([
      'Criterion 2.4.2 has a "cannot tell" outcome and stays not tested.',
      'Test https://example.com/rules/custom could not be mapped to a WCAG success criterion and was skipped.',
      'No WCAG-EM evaluation metadata found; report details use placeholders.'
    ])
    expect(imported.issues).toEqual([])
  })
})
