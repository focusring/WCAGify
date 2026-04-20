import { allScEntries } from '../wcag'
import type { WcagVersion, Level } from '../types'
import type { ImportWarning } from './warnings'

interface ParsedReportEvaluation {
  evaluator: string
  commissioner: string
  target: string
  targetLevel: Level
  targetWcagVersion: WcagVersion
  date: string
  specialRequirements: string
}

interface ParsedSample {
  id: string
  title: string
  url: string
  description: string
}

interface ParsedReport {
  title: string
  language: 'en' | 'nl'
  evaluation: ParsedReportEvaluation
  scope: string[]
  baseline: string[]
  technologies: string[]
  sample: ParsedSample[]
  scStatuses: Record<string, 'passed' | 'not-present'>
}

interface ParsedIssue {
  title: string
  sc: string
  sample: string
  severity?: string
  type?: string
  difficulty?: string
}

type ImportFormat = 'wcagem' | 'act'

interface ParseResult {
  report: ParsedReport
  issues: ParsedIssue[]
  warnings: ImportWarning[]
  format: ImportFormat
}

type JsonValue = null | string | number | boolean | JsonValue[] | JsonObject
interface JsonObject {
  [key: string]: JsonValue
}

function isObject(x: JsonValue | undefined): x is JsonObject {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function asString(x: JsonValue | undefined): string | undefined {
  if (typeof x === 'string') return x
  if (isObject(x) && typeof x['@value'] === 'string') return x['@value']
  if (Array.isArray(x) && x.length > 0) return asString(x[0])
  return undefined
}

function asArray(x: JsonValue | undefined): JsonValue[] {
  if (Array.isArray(x)) return x
  if (x === undefined || x === null) return []
  return [x]
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value
}

function normaliseDate(raw: string | undefined): string {
  if (!raw) return ''
  const match = raw.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : raw
}

const LEVEL_PATTERNS: { pattern: RegExp; level: Level }[] = [
  { pattern: /AAA-?Conformance$/, level: 'AAA' },
  { pattern: /AA-?Conformance$/, level: 'AA' },
  { pattern: /A-?Conformance$/, level: 'A' }
]

function parseLevel(raw: string | undefined, warnings: ImportWarning[]): Level {
  if (!raw) return 'AA'
  if (raw === 'A' || raw === 'AA' || raw === 'AAA') return raw
  for (const { pattern, level } of LEVEL_PATTERNS) {
    if (pattern.test(raw)) return level
  }
  warnings.push({
    code: 'unknown-level',
    message: `Unrecognised conformance target "${raw}", defaulting to AA`,
    context: { raw }
  })
  return 'AA'
}

function parseWcagVersion(raw: string | undefined, warnings: ImportWarning[]): WcagVersion {
  if (raw === '2.1' || raw === '2.2') return raw
  if (raw === '2.0') {
    warnings.push({
      code: 'unknown-wcag-version',
      message: 'WCAG 2.0 is not supported by WCAGify, upgrading to 2.1',
      context: { raw }
    })
    return '2.1'
  }
  if (raw !== undefined && raw !== '') {
    warnings.push({
      code: 'unknown-wcag-version',
      message: `Unrecognised WCAG version "${raw}", defaulting to 2.2`,
      context: { raw }
    })
  }
  return '2.2'
}

interface ScIndex {
  byNumber: Record<string, { slug: string }>
  bySlug: Record<string, string>
}

function buildScIndex(entries: Record<string, { slug: string }>): ScIndex {
  const bySlug: Record<string, string> = {}
  for (const [num, entry] of Object.entries(entries)) {
    bySlug[entry.slug] = num
  }
  return { byNumber: entries, bySlug }
}

function extractSc(
  assertion: JsonObject,
  scIndex: ScIndex,
  warnings: ImportWarning[]
): string | undefined {
  const { test } = assertion
  if (!isObject(test) && typeof test !== 'string') return undefined

  const testObj: JsonObject = isObject(test) ? test : {}

  const isPartOfRaw = isObject(test) ? asString(test.isPartOf) : undefined
  if (isPartOfRaw) {
    const stripped = stripPrefix(isPartOfRaw, 'WCAG2:')
    if (scIndex.byNumber[stripped]) return stripped
    if (scIndex.bySlug[stripped]) return scIndex.bySlug[stripped]
  }

  const testId =
    asString(testObj['@id']) ??
    asString(testObj.id) ??
    (typeof test === 'string' ? test : undefined)
  if (testId) {
    const afterColon = testId.includes(':') ? testId.split(':').slice(-1)[0]! : testId
    if (scIndex.bySlug[afterColon]) return scIndex.bySlug[afterColon]
    if (scIndex.byNumber[afterColon]) return afterColon
  }

  const titleStr = asString(testObj.title) ?? asString(testObj.num)
  if (titleStr) {
    const scMatch = titleStr.match(/^(\d+\.\d+\.\d+)/)
    if (scMatch && scIndex.byNumber[scMatch[1]!]) return scMatch[1]
    if (scIndex.byNumber[titleStr]) return titleStr
  }

  if (isPartOfRaw) {
    const stripped = stripPrefix(isPartOfRaw, 'WCAG2:')
    warnings.push({
      code: 'unknown-sc',
      message: `SC "${stripped}" is not in the selected WCAG version`,
      context: { sc: stripped }
    })
    return stripped
  }
  return undefined
}

const OUTCOME_MAP: Record<string, 'failed' | 'passed' | 'inapplicable' | 'untested' | 'cantTell'> =
  {
    'earl:failed': 'failed',
    'earl:passed': 'passed',
    'earl:inapplicable': 'inapplicable',
    'earl:untested': 'untested',
    'earl:cantTell': 'cantTell'
  }

function extractOutcome(
  assertion: JsonObject
): 'failed' | 'passed' | 'inapplicable' | 'untested' | 'cantTell' | undefined {
  const { result } = assertion
  if (!isObject(result)) return undefined
  const { outcome } = result
  const id = isObject(outcome)
    ? (asString(outcome['@id']) ?? asString(outcome.id))
    : asString(outcome)
  if (!id) return undefined
  return OUTCOME_MAP[id]
}

const DESC_PAGE_HINT = /^(.*?)\s*\(on:\s*(.+?)\)\s*$/

function splitDescription(raw: string | undefined): { title: string; pageHint?: string } {
  if (!raw) return { title: '' }
  const match = raw.match(DESC_PAGE_HINT)
  if (match) return { title: match[1]!, pageHint: match[2]! }
  return { title: raw }
}

function parseTechnologies(raw: JsonValue | undefined): string[] {
  const items = asArray(raw)
  const out: string[] = []
  for (const item of items) {
    if (typeof item === 'string') out.push(item)
    else if (isObject(item)) {
      const title = asString(item.title) ?? asString(item['@id'])
      if (title) out.push(title)
    }
  }
  return out
}

function extractUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s)]+/)
  return match ? match[0] : undefined
}

const REGEX_SPECIALS = /[$()*+.?[\\\]^{|}]/g

function escapeRegex(raw: string): string {
  return raw.replace(REGEX_SPECIALS, String.raw`\$&`)
}

function cleanDescription(raw: string, url: string): string {
  const pattern = new RegExp(String.raw`\s*\(${escapeRegex(url)}\)\s*$`)
  return raw.replace(pattern, '').trim()
}

function parseSample(
  structuredSample: JsonValue | undefined,
  warnings: ImportWarning[]
): ParsedSample[] {
  const items = asArray(structuredSample)
  const samples: ParsedSample[] = []
  for (const [i, item] of items.entries()) {
    if (!isObject(item)) continue
    const rawId = asString(item['@id']) ?? asString(item.id) ?? ''
    const title = asString(item.title) ?? ''
    const description = asString(item.description) ?? ''
    const urlCandidate = rawId.startsWith('http') ? rawId : (extractUrl(description) ?? '')
    if (!urlCandidate) {
      warnings.push({
        code: 'missing-sample',
        message: `Sample ${i + 1} has no URL and was skipped`,
        context: { index: i }
      })
      continue
    }
    samples.push({
      id: `page-${i + 1}`,
      title: title || `Page ${i + 1}`,
      url: urlCandidate,
      description: cleanDescription(description, urlCandidate)
    })
  }
  return samples
}

function detectFormat(root: JsonObject): ImportFormat {
  const typeRaw = root['@type'] ?? root.type
  const topType = asString(typeRaw)
  if (topType === 'Evaluation' || topType === 'wcagem:Evaluation') return 'wcagem'
  if (root.defineScope || root.auditSample || root.selectSample) return 'wcagem'
  if (root['@graph']) return 'act'
  return 'wcagem'
}

interface ProcessAssertionContext {
  scIndex: ScIndex
  samples: ParsedSample[]
  sampleByUrl: Map<string, string>
  sampleByTitle: Map<string, string>
  defaultSampleId: string
  issues: ParsedIssue[]
  scStatuses: Record<string, 'passed' | 'not-present'>
  warnings: ImportWarning[]
}

function processAssertion(
  assertion: JsonObject,
  subjectUrl: string | undefined,
  ctx: ProcessAssertionContext
): void {
  const sc = extractSc(assertion, ctx.scIndex, ctx.warnings)
  if (!sc) {
    ctx.warnings.push({ code: 'assertion-dropped', message: 'Assertion has no identifiable SC' })
    return
  }
  const outcome = extractOutcome(assertion)
  if (!outcome) {
    ctx.warnings.push({
      code: 'assertion-dropped',
      message: `Assertion for ${sc} has no recognised outcome`,
      context: { sc }
    })
    return
  }
  if (outcome === 'untested') return
  if (outcome === 'passed') {
    ctx.scStatuses[sc] = 'passed'
    return
  }
  if (outcome === 'inapplicable') {
    ctx.scStatuses[sc] = 'not-present'
    return
  }
  if (outcome === 'cantTell') {
    ctx.warnings.push({
      code: 'unsupported-outcome',
      message: `Cannot-tell outcome for ${sc} imported as a failed issue`,
      context: { sc }
    })
  }

  const resultNode = isObject(assertion.result) ? assertion.result : {}
  const rawDescription = asString(resultNode.description) ?? ''
  const { title: issueTitle, pageHint } = splitDescription(rawDescription)
  const finalTitle = issueTitle || sc

  let sampleId = ctx.defaultSampleId
  if (subjectUrl && ctx.sampleByUrl.has(subjectUrl)) {
    sampleId = ctx.sampleByUrl.get(subjectUrl)!
  } else if (pageHint && ctx.sampleByTitle.has(pageHint)) {
    sampleId = ctx.sampleByTitle.get(pageHint)!
  } else if (pageHint) {
    ctx.warnings.push({
      code: 'orphan-subject',
      message: `Issue for ${sc} references page "${pageHint}" which is not in the sample`,
      context: { sc, pageHint }
    })
  } else if (subjectUrl && !ctx.sampleByUrl.has(subjectUrl)) {
    ctx.warnings.push({
      code: 'orphan-subject',
      message: `Issue for ${sc} references page "${subjectUrl}" which is not in the sample`,
      context: { sc, subjectUrl }
    })
  }

  ctx.issues.push({
    title: finalTitle,
    sc,
    sample: sampleId,
    severity: asString(assertion['wcagify:severity']),
    type: asString(assertion['wcagify:type']),
    difficulty: asString(assertion['wcagify:difficulty'])
  })
}

function parseWcagEm(root: JsonObject, warnings: ImportWarning[]): ParseResult {
  const defineScope = isObject(root.defineScope) ? root.defineScope : {}
  const scopeNode = isObject(defineScope.scope) ? defineScope.scope : {}
  const exploreTarget = isObject(root.exploreTarget) ? root.exploreTarget : {}
  const selectSample = isObject(root.selectSample) ? root.selectSample : {}
  const reportFindings = isObject(root.reportFindings) ? root.reportFindings : {}

  const title =
    asString(reportFindings.title) ?? asString(root.title) ?? asString(scopeNode.title) ?? ''
  if (!title) warnings.push({ code: 'missing-title', message: 'No evaluation title found' })

  const evaluator =
    asString(reportFindings.evaluator) ??
    asString(root.evaluator) ??
    asString(root['dcterms:creator']) ??
    ''
  if (!evaluator)
    warnings.push({ code: 'missing-evaluator', message: 'No evaluator (report creator) found' })

  const date = normaliseDate(asString(reportFindings.date) ?? asString(root.date))
  if (!date) warnings.push({ code: 'missing-date', message: 'No evaluation date found' })

  const commissioner = asString(reportFindings.commissioner) ?? ''
  const target = asString(scopeNode.title) ?? title
  const specialRequirements =
    asString(reportFindings.evaluationSpecifics) ??
    asString(defineScope.additionalEvaluationRequirements) ??
    ''

  const targetLevel = parseLevel(
    asString(defineScope.conformanceTarget) ?? asString(defineScope.step1b),
    warnings
  )
  const targetWcagVersion = parseWcagVersion(asString(defineScope.wcagVersion), warnings)

  const scopeDescription = asString(scopeNode.description) ?? ''
  const scope = scopeDescription
    ? scopeDescription
        .split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  if (scope.length === 0) warnings.push({ code: 'missing-scope', message: 'No scope URLs found' })

  const baseline = (asString(defineScope.accessibilitySupportBaseline) ?? '')
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  const technologies = parseTechnologies(exploreTarget.technologiesReliedUpon)
  const sample = parseSample(selectSample.structuredSample, warnings)
  const language = asString(root['@language']) === 'nl' ? 'nl' : 'en'

  const scIndex = buildScIndex(allScEntries(targetWcagVersion, language))
  const ctx: ProcessAssertionContext = {
    scIndex,
    samples: sample,
    sampleByUrl: new Map(sample.map((s) => [s.url, s.id])),
    sampleByTitle: new Map(sample.map((s) => [s.title, s.id])),
    defaultSampleId: sample[0]?.id ?? 'page-1',
    issues: [],
    scStatuses: {},
    warnings
  }

  for (const a of asArray(root.auditSample)) {
    if (isObject(a)) processAssertion(a, undefined, ctx)
  }

  return {
    report: {
      title,
      language,
      evaluation: {
        evaluator,
        commissioner,
        target,
        targetLevel,
        targetWcagVersion,
        date,
        specialRequirements
      },
      scope,
      baseline,
      technologies,
      sample,
      scStatuses: ctx.scStatuses
    },
    issues: ctx.issues,
    warnings,
    format: 'wcagem'
  }
}

function deriveTitleFromUrl(url: string, index: number): string {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/^\/+|\/+$/g, '') || 'root'
    return `${u.hostname}${path === 'root' ? '' : `/${path}`}`
  } catch {
    return `Page ${index + 1}`
  }
}

function parseAct(root: JsonObject, warnings: ImportWarning[]): ParseResult {
  const graph = asArray(root['@graph'])

  const testSubjectNodes: JsonObject[] = []
  const looseAssertions: JsonObject[] = []
  let assertorName: string | undefined = undefined
  let assertorDescription: string | undefined = undefined

  for (const node of graph) {
    if (!isObject(node)) continue
    const typeRaw = node['@type'] ?? node.type
    const types = asArray(typeRaw).map((t) => asString(t) ?? '')
    if (types.some((t) => t === 'TestSubject' || t === 'earl:TestSubject')) {
      testSubjectNodes.push(node)
    } else if (types.some((t) => t === 'Assertion' || t === 'earl:Assertion')) {
      looseAssertions.push(node)
    } else if (types.some((t) => t === 'Assertor' || t === 'earl:Assertor' || t === 'Software')) {
      assertorName = asString(node.name) ?? asString(node.title) ?? assertorName
      assertorDescription = asString(node.description) ?? assertorDescription
    }
  }

  if (testSubjectNodes.length === 0 && looseAssertions.length > 0) {
    warnings.push({
      code: 'missing-sample',
      message: 'No TestSubjects found; synthesising a single page from the first assertion'
    })
  }

  const sample: ParsedSample[] = []
  const sampleByUrl = new Map<string, string>()
  for (const [i, node] of testSubjectNodes.entries()) {
    const url = asString(node.source) ?? asString(node['@id']) ?? asString(node.id) ?? ''
    if (!url) {
      warnings.push({
        code: 'missing-sample',
        message: `TestSubject ${i + 1} has no source URL`,
        context: { index: i }
      })
      continue
    }
    const id = `page-${sample.length + 1}`
    sample.push({
      id,
      title: asString(node.title) ?? deriveTitleFromUrl(url, i),
      url,
      description: asString(node.description) ?? ''
    })
    sampleByUrl.set(url, id)
  }

  if (sample.length === 0) {
    sample.push({
      id: 'page-1',
      title: 'Imported page',
      url: 'https://example.invalid/',
      description: 'Placeholder page synthesised during import'
    })
    sampleByUrl.set('https://example.invalid/', 'page-1')
  }

  const title = assertorName ? `Imported from ${assertorName}` : 'Imported evaluation'
  const evaluator = assertorName ?? ''
  if (!evaluator) warnings.push({ code: 'missing-evaluator', message: 'No assertor name found' })

  warnings.push({
    code: 'unknown-level',
    message: 'Conformance level not carried in EARL — defaulting to AA'
  })
  warnings.push({
    code: 'unknown-wcag-version',
    message: 'WCAG version not carried in EARL — defaulting to 2.2'
  })
  warnings.push({
    code: 'missing-date',
    message: 'Evaluation date not carried in EARL — set to today'
  })
  const today = new Date().toISOString().slice(0, 10)

  const scIndex = buildScIndex(allScEntries('2.2', 'en'))
  const ctx: ProcessAssertionContext = {
    scIndex,
    samples: sample,
    sampleByUrl,
    sampleByTitle: new Map(sample.map((s) => [s.title, s.id])),
    defaultSampleId: sample[0]!.id,
    issues: [],
    scStatuses: {},
    warnings
  }

  for (const node of testSubjectNodes) {
    const subjectUrl = asString(node.source) ?? asString(node['@id'])
    for (const a of asArray(node.assertions)) {
      if (isObject(a)) processAssertion(a, subjectUrl, ctx)
    }
  }
  for (const a of looseAssertions) {
    const subjectRef = isObject(a.subject) ? asString(a.subject['@id']) : asString(a.subject)
    processAssertion(a, subjectRef, ctx)
  }

  return {
    report: {
      title,
      language: 'en',
      evaluation: {
        evaluator,
        commissioner: '',
        target: assertorDescription ?? title,
        targetLevel: 'AA',
        targetWcagVersion: '2.2',
        date: today,
        specialRequirements: ''
      },
      scope: sample.map((s) => s.url),
      baseline: [],
      technologies: [],
      sample,
      scStatuses: ctx.scStatuses
    },
    issues: ctx.issues,
    warnings,
    format: 'act'
  }
}

function parseEarl(doc: unknown): ParseResult {
  const warnings: ImportWarning[] = []
  if (!isObject(doc as JsonValue)) {
    throw new Error('EARL document must be an object')
  }
  const root = doc as JsonObject
  const format = detectFormat(root)
  return format === 'act' ? parseAct(root, warnings) : parseWcagEm(root, warnings)
}

export { parseEarl, detectFormat }
export type { ParsedReport, ParsedIssue, ParseResult, ParsedSample, ImportFormat }
