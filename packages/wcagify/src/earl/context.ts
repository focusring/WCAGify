import type { WcagVersion } from '../types'

/** Namespace of the WCAGify-specific terms used in EARL exports. */
const WCAGIFY_NS = 'https://github.com/focusring/WCAGify/blob/main/docs/reference/earl.md#'

/** Namespace of the WCAG specification whose anchors identify the success criteria. */
const WCAG_SPEC_NS: Record<WcagVersion, string> = {
  '2.0': 'http://www.w3.org/TR/WCAG20/#',
  '2.1': 'http://www.w3.org/TR/WCAG21/#',
  '2.2': 'http://www.w3.org/TR/WCAG22/#'
}

/**
 * JSON-LD context of a WCAGify EARL export.
 *
 * The terms follow the context used by the W3C WCAG-EM Report Tool
 * (https://github.com/w3c/wcag-em-report-tool/blob/master/docs/EARL+JSON-LD.md)
 * so that exports can be read by that tool and by other tools that consume
 * EARL 1.0 assertions. WCAGify-specific terms live in their own namespace.
 */
function buildEarlContext(wcagVersion: WcagVersion): Record<string, unknown> {
  return {
    '@vocab': 'http://www.w3.org/TR/WCAG-EM/#',

    wcagem: 'http://www.w3.org/TR/WCAG-EM/#',
    WCAG2: WCAG_SPEC_NS[wcagVersion],
    earl: 'http://www.w3.org/ns/earl#',
    dct: 'http://purl.org/dc/terms/',
    wai: 'http://www.w3.org/WAI/',
    sch: 'http://schema.org/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    wcagify: WCAGIFY_NS,

    Evaluation: 'wcagem:Evaluation',
    EvaluationScope: 'wcagem:EvaluationScope',
    TestSubject: 'earl:TestSubject',
    WebSite: 'sch:WebSite',
    Sample: 'wcagem:Sample',
    WebPage: 'sch:WebPage',
    Technology: 'WCAG2:dfn-technologies',
    Assertion: 'earl:Assertion',
    Assertor: 'earl:Assertor',
    TestResult: 'earl:TestResult',
    Person: 'foaf:Person',
    Organization: 'foaf:Organization',

    title: 'dct:title',
    summary: 'dct:summary',
    description: 'dct:description',
    creator: { '@id': 'dct:creator', '@type': '@id' },
    publisher: { '@id': 'dct:publisher', '@type': '@id' },
    date: 'dct:date',
    name: 'foaf:name',
    commissioner: 'wcagem:commissioner',
    reliedUponTechnology: 'WCAG2:dfn-relied-upon',
    evaluationScope: 'step1',
    commonPages: 'step2a',
    essentialFunctionality: 'step2b',
    pageTypeVariety: 'step2c',
    otherRelevantPages: 'step2e',
    structuredSample: 'step3a',
    randomSample: 'step3b',
    auditResult: 'step4',
    specifics: 'step5b',

    conformanceTarget: { '@id': 'step1b', '@type': '@id' },
    accessibilitySupportBaseline: 'step1c',
    additionalEvalRequirement: 'step1d',
    website: 'WCAG2:dfn-set-of-web-pages',
    siteScope: 'step1a',
    siteName: 'sch:name',

    webpage: 'WCAG2:dfn-web-page-s',
    source: { '@id': 'dct:source', '@type': '@id' },
    tested: 'https://github.com/w3c/wcag-em-report-tool/blob/master/docs/EARL%2BJSON-LD.md#tested',

    test: { '@id': 'earl:test', '@type': '@id' },
    assertedBy: { '@id': 'earl:assertedBy', '@type': '@id' },
    subject: { '@id': 'earl:subject', '@type': '@id' },
    result: 'earl:result',
    mode: { '@id': 'earl:mode', '@type': '@id' },
    outcome: { '@id': 'earl:outcome', '@type': '@id' },
    hasPart: 'dct:hasPart',
    isPartOf: { '@id': 'dct:isPartOf', '@type': '@id' },

    severity: 'wcagify:severity',
    issueType: 'wcagify:issueType',
    difficulty: 'wcagify:difficulty',
    wcagVersion: 'wcagify:wcagVersion',
    scorecard: 'wcagify:scorecard',

    id: '@id',
    type: '@type',
    lang: '@language'
  }
}

export { buildEarlContext, WCAG_SPEC_NS, WCAGIFY_NS }
