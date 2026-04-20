import { allScEntries, levelIncludes } from '../wcag'
import type { WcagVersion, Language, Level } from '../types'
import { HYBRID_CONTEXT } from './context'
import type {
  EarlDocument,
  EarlWebpage,
  EarlAssertion,
  EarlOutcome,
  EarlOutcomeValue,
  EarlReportFindings
} from './types'

interface EarlReportInput {
  title?: string
  language?: 'nl' | 'en'
  evaluation: {
    evaluator: string
    commissioner?: string
    target?: string
    targetLevel: string
    targetWcagVersion: string
    date: string
    specialRequirements?: string
  }
  scope: string[]
  baseline?: string[]
  technologies?: string[]
  sample: { id: string; title: string; url: string; description?: string }[]
  scStatuses?: Record<string, string>
}

interface EarlIssueInput {
  sc: string
  title: string
  sample: string
  severity?: string
  type?: string
  difficulty?: string
  path?: string
}

interface BuildEarlOptions {
  report: EarlReportInput
  issues: EarlIssueInput[]
  slug: string
  baseUrl: string
}

function sanitizeWcagVersion(v: string): WcagVersion {
  return v === '2.1' ? '2.1' : '2.2'
}

function sanitizeLevel(l: string): Level {
  if (l === 'A' || l === 'AA' || l === 'AAA') return l
  return 'AA'
}

function sanitizeLanguage(l: string | undefined): Language {
  return l === 'nl' ? 'nl' : 'en'
}

function statusToOutcome(status: string | undefined): EmittedOutcome {
  if (status === 'passed') return 'earl:passed'
  if (status === 'not-present') return 'earl:inapplicable'
  return 'earl:untested'
}

type EmittedOutcome = Exclude<EarlOutcome, 'earl:cantTell'>

function outcomeToValue(outcome: EmittedOutcome): EarlOutcomeValue {
  const typeMap = {
    'earl:passed': 'Pass',
    'earl:failed': 'Fail',
    'earl:inapplicable': 'NotApplicable',
    'earl:untested': 'NotTested'
  } as const
  return { '@id': outcome, '@type': ['OutcomeValue', typeMap[outcome]] }
}

function webpageForSample(page: {
  id: string
  title: string
  url: string
  description?: string
}): EarlWebpage {
  const description = page.description?.trim() ? `${page.description} (${page.url})` : page.url
  return {
    '@id': page.url,
    '@type': ['TestSubject', 'Webpage'],
    title: page.title,
    description
  }
}

interface AssertionInputs {
  index: number
  sc: string
  scSlug: string
  scTitle: string
  subject: EarlWebpage
  assertorId: string
  outcome: EmittedOutcome
  description?: string
  issue?: EarlIssueInput
  sampleHint?: string
}

function makeAssertion(inputs: AssertionInputs): EarlAssertion {
  const {
    index,
    sc,
    scSlug,
    scTitle,
    subject,
    assertorId,
    outcome,
    description,
    issue,
    sampleHint
  } = inputs
  const assertionSubject: EarlWebpage = {
    '@id': `_:assertionSubject_${index}`,
    '@type': ['TestSubject', 'Website'],
    title: subject.title,
    description: subject.description
  }
  const combinedDescription =
    description && subject.title ? `${description} (on: ${subject.title})` : description
  const assertion: EarlAssertion = {
    '@id': `_:assertion_${index}`,
    '@type': 'Assertion',
    assertedBy: assertorId,
    mode: 'earl:manual',
    subject: assertionSubject,
    test: {
      '@id': scSlug ? `WCAG:${scSlug}` : `_:test_${sc}`,
      '@type': 'TestCriterion',
      title: scTitle,
      isPartOf: [`WCAG2:${sc}`]
    },
    result: {
      '@type': 'TestResult',
      outcome: outcomeToValue(outcome),
      ...(combinedDescription ? { description: combinedDescription } : {})
    }
  }
  if (issue?.severity) assertion['wcagify:severity'] = issue.severity
  if (issue?.type) assertion['wcagify:type'] = issue.type
  if (issue?.difficulty) assertion['wcagify:difficulty'] = issue.difficulty
  if (issue?.path) assertion['wcagify:issuePath'] = issue.path
  if (sampleHint) assertion['wcagify:sampleHint'] = sampleHint
  return assertion
}

function buildReportFindings(report: EarlReportInput): EarlReportFindings {
  return {
    '@id': '_:reportFindings',
    title: report.title ?? report.evaluation.target ?? '',
    commissioner: report.evaluation.commissioner ?? '',
    evaluator: report.evaluation.evaluator,
    date: report.evaluation.date,
    summary: '',
    evaluationSpecifics: report.evaluation.specialRequirements ?? '',
    documentSteps: [
      { '@id': '_:defineScope' },
      { '@id': '_:exploreTarget' },
      { '@id': '_:selectSample' }
    ]
  }
}

function buildEarl({ report, issues, slug, baseUrl }: BuildEarlOptions): EarlDocument {
  const wcagVersion = sanitizeWcagVersion(report.evaluation.targetWcagVersion)
  const language = sanitizeLanguage(report.language)
  const targetLevel = sanitizeLevel(report.evaluation.targetLevel)
  const entries = allScEntries(wcagVersion, language)
  const includedLevels = levelIncludes[targetLevel]

  const assertorId = `${baseUrl}/reports/${slug}#assertor`
  const websiteScopeId = '_:websiteScope'

  const structuredSample: EarlWebpage[] = report.sample.map(webpageForSample)
  const subjectById = new Map<string, EarlWebpage>()
  for (const page of structuredSample) {
    const rawSample = report.sample.find((s) => s.url === page['@id'])
    if (rawSample) subjectById.set(rawSample.id, page)
  }
  const fallbackSubject: EarlWebpage = structuredSample[0] ?? {
    '@id': report.scope[0] ?? websiteScopeId,
    '@type': ['TestSubject', 'Webpage'],
    title: report.evaluation.target ?? slug,
    description: report.scope[0] ?? ''
  }

  const issuesBySc = new Map<string, EarlIssueInput[]>()
  for (const issue of issues) {
    if (!issue.sc || issue.sc === 'none') continue
    const list = issuesBySc.get(issue.sc)
    if (list) list.push(issue)
    else issuesBySc.set(issue.sc, [issue])
  }

  const auditSample: EarlAssertion[] = []
  let index = 1

  for (const [sc, list] of issuesBySc) {
    const entry = entries[sc]
    const scTitle = entry ? `${sc}: ${entry.name}` : sc
    const scSlug = entry?.slug ?? ''
    for (const issue of list) {
      const routed = subjectById.get(issue.sample)
      const subject = routed ?? fallbackSubject
      const sampleHint = !routed && issue.sample ? issue.sample : undefined
      auditSample.push(
        makeAssertion({
          index: index++,
          sc,
          scSlug,
          scTitle,
          subject,
          assertorId,
          outcome: 'earl:failed',
          description: issue.title,
          issue,
          sampleHint
        })
      )
    }
  }

  const scStatuses = report.scStatuses ?? {}
  for (const [sc, entry] of Object.entries(entries)) {
    if (entry.obsolete && wcagVersion === '2.2') continue
    if (!includedLevels.includes(entry.level)) continue
    if (issuesBySc.has(sc)) continue
    const outcome = statusToOutcome(scStatuses[sc])
    if (outcome === 'earl:untested') continue
    auditSample.push(
      makeAssertion({
        index: index++,
        sc,
        scSlug: entry.slug,
        scTitle: `${sc}: ${entry.name}`,
        subject: fallbackSubject,
        assertorId,
        outcome
      })
    )
  }

  const websiteTitle = report.evaluation.target ?? report.title ?? slug
  const websiteDescription = report.scope.length ? report.scope.join(', ') : ''

  return {
    '@context': HYBRID_CONTEXT,
    '@type': 'Evaluation',
    '@language': language,
    reportToolVersion: 'WCAGify',
    defineScope: {
      '@id': '_:defineScope',
      scope: {
        '@id': websiteScopeId,
        title: websiteTitle,
        description: websiteDescription
      },
      conformanceTarget: targetLevel,
      accessibilitySupportBaseline: (report.baseline ?? []).join('; '),
      additionalEvaluationRequirements: report.evaluation.specialRequirements ?? '',
      wcagVersion
    },
    exploreTarget: {
      '@id': '_:exploreTarget',
      technologiesReliedUpon: (report.technologies ?? []).map((t) => ({ title: t })),
      essentialFunctionality: '',
      pageTypeVariety: ''
    },
    selectSample: {
      '@id': '_:selectSample',
      structuredSample,
      randomSample: []
    },
    auditSample,
    reportFindings: buildReportFindings(report)
  }
}

export { buildEarl }
export type { EarlReportInput, EarlIssueInput, BuildEarlOptions }
