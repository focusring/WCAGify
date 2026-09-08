import wcag20Ids from '../data/wcag20-ids.json'
import type { Level, SamplePage, ScStatuses, WcagVersion } from '../types'
import {
  allScEntries,
  levelIncludes,
  normalizeScStatuses,
  resolveScStatus,
  scorecard
} from '../wcag'
import { buildEarlContext } from './context'
import { minimarkToText } from './minimark'
import type { MinimarkBody } from './minimark'

type TextBody = MinimarkBody | string | null | undefined

interface EarlReportSource {
  /** Content path of the report, for example `/reports/example`. */
  path?: string | null
  title: string
  description?: string | null
  language?: string | null
  evaluation: {
    evaluator: string
    commissioner: string
    target: string
    targetLevel: Level
    targetWcagVersion: WcagVersion
    date: string
    specialRequirements?: string | null
  }
  scope: string[]
  outOfScope?: string[] | null
  baseline: string[]
  technologies: string[]
  sample: SamplePage[]
  scStatuses?: ScStatuses | null
  body?: TextBody
}

interface EarlIssueSource {
  path?: string | null
  title: string
  sc: string
  severity?: string | null
  type?: string | null
  difficulty?: string | null
  sample: string
  description?: string | null
  body?: TextBody
}

interface EarlExportOptions {
  /** Absolute origin of the WCAGify instance, used to mint stable IRIs. */
  baseUrl?: string
  /** WCAGify version, recorded as the publisher of the export. */
  version?: string
}

type EarlOutcome = 'earl:passed' | 'earl:failed' | 'earl:inapplicable' | 'earl:untested'

interface EarlTestResult {
  type: 'TestResult'
  outcome: EarlOutcome
  title?: string
  description?: string
  severity?: string
  issueType?: string
  difficulty?: string
}

interface EarlAssertion {
  type: 'Assertion'
  id?: string
  test: string
  assertedBy: string
  subject: string | string[]
  mode: 'earl:manual'
  result: EarlTestResult
  multiPage?: boolean
  hasPart?: EarlAssertion[]
}

interface EarlWebPage {
  type: ['TestSubject', 'WebPage']
  id: string
  title: string
  description: string
  source?: string
  tested: boolean
}

interface EarlReport {
  '@context': Record<string, unknown>
  '@graph': Record<string, unknown>[]
}

const EVALUATOR_ID = '_:evaluator'
const WEBSITE_ID = '_:website'

const CONFORMANCE_TARGET: Record<Level, string> = {
  A: 'wai:WCAG2A-Conformance',
  AA: 'wai:WCAG2AA-Conformance',
  AAA: 'wai:WCAG2AAA-Conformance'
}

/** IRIs of well-known technologies, matching the WCAG-EM Report Tool where it knows them. */
const KNOWN_TECHNOLOGIES: Record<string, string> = {
  html: 'http://www.w3.org/TR/html5/',
  html5: 'http://www.w3.org/TR/html5/',
  css: 'http://www.w3.org/Style/CSS/specs/',
  'wai-aria': 'http://www.w3.org/TR/wai-aria/',
  aria: 'http://www.w3.org/TR/wai-aria/',
  svg: 'http://www.w3.org/TR/SVG/',
  dom: 'http://www.w3.org/DOM/',
  javascript: 'https://tc39.es/ecma262/',
  ecmascript: 'https://tc39.es/ecma262/',
  pdf: 'https://www.pdfa.org/resource/iso-32000-pdf/',
  epub: 'https://www.w3.org/TR/epub-33/'
}

function blankNode(label: string): string {
  return `_:${label.replace(/[^A-Za-z0-9_-]+/g, '-')}`
}

function sampleNodeId(sampleId: string): string {
  return blankNode(`sample-${sampleId}`)
}

function slugFromPath(path: string | null | undefined): string | undefined {
  const slug = path?.replace(/^\/reports\//, '')
  return slug || undefined
}

/**
 * Identifier of a success criterion in the WCAG specification the report was
 * evaluated against. WCAG 2.0 uses different anchors than 2.1 and 2.2.
 */
function criterionTestId(slug: string, wcagVersion: WcagVersion): string {
  if (wcagVersion === '2.0') {
    const legacy = (wcag20Ids as Record<string, string>)[slug]
    return `WCAG2:${legacy ?? slug}`
  }
  return `WCAG2:${slug}`
}

function outcomeFor(status: ReturnType<typeof resolveScStatus>): EarlOutcome {
  switch (status) {
    case 'failed': {
      return 'earl:failed'
    }
    case 'passed': {
      return 'earl:passed'
    }
    case 'not-present': {
      return 'earl:inapplicable'
    }
    default: {
      return 'earl:untested'
    }
  }
}

function issueText(issue: EarlIssueSource): string {
  const text = minimarkToText(issue.body)
  return text || issue.description?.trim() || ''
}

function technologyNode(title: string): Record<string, unknown> {
  const id = KNOWN_TECHNOLOGIES[title.trim().toLowerCase()]
  return id ? { type: 'Technology', id, title } : { type: 'Technology', title }
}

function siteScopeText(report: EarlReportSource): string {
  const lines = [...report.scope]
  if (report.outOfScope?.length) {
    lines.push('', ...report.outOfScope.map((item) => `Excluded: ${item}`))
  }
  return lines.join('\n')
}

function samplePageNode(page: SamplePage, tested: boolean): EarlWebPage {
  const node: EarlWebPage = {
    type: ['TestSubject', 'WebPage'],
    id: sampleNodeId(page.id),
    title: page.title,
    description: page.description,
    tested
  }
  if (page.url) node.source = page.url
  return node
}

function issueAssertion(
  issue: EarlIssueSource,
  test: string,
  options: { baseUrl?: string; slug?: string; knownSampleIds: Set<string> }
): EarlAssertion {
  const result: EarlTestResult = {
    type: 'TestResult',
    outcome: 'earl:failed',
    title: issue.title
  }
  const description = issueText(issue)
  if (description) result.description = description
  if (issue.severity) result.severity = issue.severity
  if (issue.type) result.issueType = issue.type
  if (issue.difficulty) result.difficulty = issue.difficulty

  const assertion: EarlAssertion = {
    type: 'Assertion',
    test,
    assertedBy: EVALUATOR_ID,
    subject: [options.knownSampleIds.has(issue.sample) ? sampleNodeId(issue.sample) : WEBSITE_ID],
    mode: 'earl:manual',
    multiPage: false,
    result
  }

  const issueSlug = issue.path?.split('/').filter(Boolean).at(-1)
  if (options.baseUrl && options.slug && issueSlug) {
    assertion.id = `${options.baseUrl}/reports/${options.slug}#issue-reports-${options.slug}-${issueSlug}`
  }
  return assertion
}

/**
 * Builds the EARL (Evaluation and Report Language) representation of a
 * report as JSON-LD, following WCAG-EM Step 5.5 and the data format of the
 * W3C WCAG-EM Report Tool.
 *
 * One assertion is produced per success criterion of the evaluated WCAG
 * version at the target conformance level, plus one for every other
 * criterion that has issues. Each issue becomes a part of its criterion's
 * assertion, asserted against the sample it was found on.
 */
function buildEarlReport(
  report: EarlReportSource,
  issues: EarlIssueSource[],
  options: EarlExportOptions = {}
): EarlReport {
  const { targetLevel, targetWcagVersion: wcagVersion } = report.evaluation
  const slug = slugFromPath(report.path)
  const baseUrl = options.baseUrl?.replace(/\/+$/, '')
  const evaluationId = baseUrl && slug ? `${baseUrl}/reports/${slug}` : '_:evaluation'

  const scStatuses = normalizeScStatuses(report.scStatuses)
  const hasRecordedOutcomes = Object.keys(scStatuses).length > 0
  const realIssues = issues.filter((issue) => issue.sc !== 'none')
  const issuesBySc = new Map<string, EarlIssueSource[]>()
  for (const issue of realIssues) {
    const list = issuesBySc.get(issue.sc)
    if (list) list.push(issue)
    else issuesBySc.set(issue.sc, [issue])
  }

  const knownSampleIds = new Set(report.sample.map((page) => page.id))
  const entries = allScEntries(wcagVersion, 'en')
  const includedLevels = levelIncludes[targetLevel]

  const criteria = Object.keys(entries)
    .filter((sc) => {
      const entry = entries[sc]!
      if (entry.obsolete && wcagVersion === '2.2') return false
      return includedLevels.includes(entry.level) || issuesBySc.has(sc)
    })
    .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  const auditResult: EarlAssertion[] = criteria.map((sc) => {
    const entry = entries[sc]!
    const test = criterionTestId(entry.slug, wcagVersion)
    const scIssues = issuesBySc.get(sc) ?? []
    const status = resolveScStatus(sc, scIssues.length > 0, scStatuses)
    const result: EarlTestResult = { type: 'TestResult', outcome: outcomeFor(status) }
    if (scIssues.length > 0) {
      result.description = scIssues.map((issue) => issue.title).join('\n')
    }
    return {
      type: 'Assertion',
      test,
      assertedBy: EVALUATOR_ID,
      subject: WEBSITE_ID,
      mode: 'earl:manual',
      result,
      hasPart: scIssues.map((issue) =>
        issueAssertion(issue, test, { baseUrl, slug, knownSampleIds })
      )
    }
  })

  const score = scorecard(realIssues, targetLevel, { wcagVersion, scStatuses })

  const evaluation: Record<string, unknown> = {
    type: 'Evaluation',
    id: evaluationId,
    lang: report.language ?? 'en',
    language: report.language ?? 'en',
    publisher: options.version
      ? `https://github.com/focusring/WCAGify/releases/tag/v${options.version}`
      : 'https://github.com/focusring/WCAGify',
    title: report.title,
    date: report.evaluation.date,
    creator: EVALUATOR_ID,
    commissioner: report.evaluation.commissioner,
    wcagVersion,
    evaluationScope: {
      type: 'EvaluationScope',
      conformanceTarget: CONFORMANCE_TARGET[targetLevel],
      accessibilitySupportBaseline: report.baseline.join('\n'),
      additionalEvalRequirement: report.evaluation.specialRequirements ?? '',
      website: {
        type: ['TestSubject', 'WebSite'],
        id: WEBSITE_ID,
        siteName: report.evaluation.target || report.title,
        siteScope: siteScopeText(report)
      }
    },
    reliedUponTechnology: report.technologies.map(technologyNode),
    structuredSample: {
      type: 'Sample',
      webpage: report.sample.map((page) => samplePageNode(page, hasRecordedOutcomes))
    },
    randomSample: { type: 'Sample', webpage: [] },
    auditResult,
    scorecard: {
      conforming: score.conforming.all,
      failed: score.failed.all,
      notTested: score.notTested.all,
      total: score.totals.all
    }
  }

  const summary = minimarkToText(report.body) || report.description?.trim()
  if (summary) evaluation.summary = summary

  const evaluator = {
    '@context': { '@vocab': 'http://xmlns.com/foaf/0.1/', id: '@id', type: '@type' },
    id: EVALUATOR_ID,
    type: 'Person',
    name: report.evaluation.evaluator
  }

  return {
    '@context': buildEarlContext(wcagVersion),
    '@graph': [evaluation, evaluator]
  }
}

/** File name for a downloaded EARL export of a report. */
function earlFileName(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'report'}-earl.jsonld`
}

export { buildEarlReport, earlFileName, criterionTestId }
export type {
  EarlReport,
  EarlReportSource,
  EarlIssueSource,
  EarlExportOptions,
  EarlAssertion,
  EarlTestResult,
  EarlOutcome
}
