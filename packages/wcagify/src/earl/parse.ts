import jsonld from 'jsonld'
import scToSlug from '../data/sc-to-slug.json'
import wcag20Ids from '../data/wcag20-ids.json'
import type { Level, SamplePage, WcagVersion } from '../types'
import { scName } from '../wcag'
import { toSlug } from '../content-utils'

/*
 * IRIs used while reading expanded JSON-LD. Reading works on the expanded
 * form so that any context (WCAGify, the W3C WCAG-EM Report Tool, axe-core,
 * hand-written EARL) is handled the same way.
 */
const EARL = 'http://www.w3.org/ns/earl#'
const DCT = 'http://purl.org/dc/terms/'
const WCAGEM = 'http://www.w3.org/TR/WCAG-EM/#'
const FOAF = 'http://xmlns.com/foaf/0.1/'
const WCAGIFY = 'https://github.com/focusring/WCAGify/blob/main/docs/reference/earl.md#'
const SCHEMA_NAME = ['http://schema.org/name', 'https://schema.org/name']
const WEB_PAGE_TYPES = new Set(['http://schema.org/WebPage', 'https://schema.org/WebPage'])
const WEB_SITE_TYPES = new Set(['http://schema.org/WebSite', 'https://schema.org/WebSite'])

const WCAG_SC_IRI =
  /w3\.org\/(?:TR\/WCAG(2[0-2])\/#|WAI\/WCAG(2[0-2])\/(?:quickref\/#|Understanding\/))([a-z0-9-]+?)(?:\.html)?$/i

type Node = Record<string, unknown>

/** A node of the expanded document, with anonymous nodes given a local id. */
interface GraphNode {
  id: string
  types: string[]
  node: Node
}

interface ImportedReport {
  title: string
  description: string
  language: 'en' | 'nl'
  evaluation: {
    evaluator: string
    commissioner: string
    target: string
    targetLevel: Level
    targetWcagVersion: WcagVersion
    date: string
    specialRequirements: string
  }
  scope: string[]
  outOfScope: string[]
  baseline: string[]
  technologies: string[]
  sample: SamplePage[]
  scStatuses: { passed: string[]; 'not-present': string[] }
  /** Executive summary, markdown. */
  summary: string
}

interface ImportedIssue {
  title: string
  sc: string
  severity?: 'Low' | 'Medium' | 'High'
  type?: 'Content' | 'Technical' | 'Design' | 'Unknown'
  difficulty?: 'Low' | 'Medium' | 'High'
  sample: string
  /** Issue body, markdown. */
  body: string
}

interface EarlImport {
  report: ImportedReport
  issues: ImportedIssue[]
  warnings: string[]
  stats: {
    assertions: number
    criteriaWithOutcome: number
    unknownTests: string[]
  }
}

/** One importable issue, as shown to a person or agent choosing what to import. */
interface ImportedIssueSummary {
  /** Position in `EarlImport.issues`; stable for the same document. */
  index: number
  title: string
  sc: string
  scName: string
  sample: string
  sampleTitle: string
  sampleUrl: string
  severity?: string
  type?: string
}

interface ParseEarlOptions {
  /** Language of the report to create. Defaults to the document language, else `en`. */
  language?: 'en' | 'nl'
}

const SEVERITIES = new Set(['Low', 'Medium', 'High'])
const ISSUE_TYPES = new Set(['Content', 'Technical', 'Design', 'Unknown'])
const PRODUCT_SAMPLE_ID = 'product'

function sortSc(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true })
}

/**
 * Anchor of a success criterion to its number, for every anchor used by
 * WCAG 2.0, 2.1 and 2.2 (some anchors changed between versions, such as
 * `target-size` becoming `target-size-enhanced` in 2.2).
 */
const SC_BY_SLUG: Record<string, string> = Object.fromEntries(
  (['2.0', '2.1', '2.2'] as const).flatMap((version) =>
    Object.entries(scToSlug[version].en).map(([sc, entry]) => [entry.slug, sc])
  )
)
/** WCAG 2.0 anchor to the WCAG 2.1/2.2 anchor of the same criterion. */
const SLUG_BY_WCAG20_ID: Record<string, string> = Object.fromEntries(
  Object.entries(wcag20Ids as Record<string, string>).map(([slug, legacy]) => [legacy, slug])
)

function values(node: Node, iri: string): unknown[] {
  const value = node[iri]
  return Array.isArray(value) ? value : []
}

function literal(node: Node, iri: string): string | undefined {
  for (const value of values(node, iri)) {
    if (value && typeof value === 'object' && '@value' in value) {
      const v = (value as { '@value': unknown })['@value']
      if (v !== undefined && v !== null) return String(v)
    }
  }
  return undefined
}

function iris(node: Node, iri: string): string[] {
  const result: string[] = []
  for (const value of values(node, iri)) {
    if (value && typeof value === 'object' && '@id' in value) {
      result.push(String((value as { '@id': unknown })['@id']))
    }
  }
  return result
}

function localName(iri: string): string {
  return iri.replace(/^.*[#/]/, '')
}

/** Maps any EARL outcome IRI, including the legacy capitalised forms, to a WCAGify status. */
function outcomeStatus(
  iri: string | undefined
): 'passed' | 'failed' | 'not-present' | 'not-tested' | 'cant-tell' | undefined {
  if (!iri) return undefined
  switch (localName(iri).toLowerCase()) {
    case 'passed':
    case 'pass': {
      return 'passed'
    }
    case 'failed':
    case 'fail': {
      return 'failed'
    }
    case 'inapplicable':
    case 'notapplicable': {
      return 'not-present'
    }
    case 'untested':
    case 'nottested': {
      return 'not-tested'
    }
    case 'canttell':
    case 'cannottell': {
      return 'cant-tell'
    }
    default: {
      return undefined
    }
  }
}

/** Success criterion number and WCAG version encoded in a WCAG IRI, if any. */
function criterionFromIri(iri: string): { sc: string; version: WcagVersion } | undefined {
  const match = WCAG_SC_IRI.exec(iri)
  if (!match) return undefined
  const versionDigits = match[1] ?? match[2] ?? '22'
  const version = `${versionDigits.charAt(0)}.${versionDigits.charAt(1)}` as WcagVersion
  let slug = match[3]!.toLowerCase()
  if (version === '2.0' && SLUG_BY_WCAG20_ID[slug]) slug = SLUG_BY_WCAG20_ID[slug]!
  const sc = SC_BY_SLUG[slug]
  return sc ? { sc, version } : undefined
}

function levelFromIri(iri: string | undefined): Level | undefined {
  const match = /WCAG2(A{1,3})-Conformance$/i.exec(iri ?? '')
  return match ? (match[1]!.toUpperCase() as Level) : undefined
}

function splitLines(text: string | undefined): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Walks the expanded document and registers every node object, nested ones
 * included, so that references by `@id` can be resolved. Expansion keeps
 * blank node labels such as `_:website`, unlike flattening.
 */
function collectNodes(expanded: unknown): Map<string, GraphNode> {
  const nodes = new Map<string, GraphNode>()
  let anonymous = 0

  const visit = (value: unknown, parentId?: string): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, parentId)
      return
    }
    if (!value || typeof value !== 'object') return
    const node = value as Node
    if ('@value' in node) return
    if ('@list' in node) {
      visit(node['@list'], parentId)
      return
    }

    const keys = Object.keys(node)
    const isReferenceOnly = keys.length === 1 && keys[0] === '@id'
    if (!isReferenceOnly) {
      const id = typeof node['@id'] === 'string' ? node['@id'] : `_:anon${anonymous++}`
      const types = Array.isArray(node['@type']) ? (node['@type'] as string[]) : []
      const existing = nodes.get(id)
      if (existing) {
        // Merge properties of a node that appears more than once.
        for (const key of keys) if (key !== '@id') existing.node[key] = node[key]
        existing.types = [...new Set([...existing.types, ...types])]
      } else {
        nodes.set(id, { id, types, node: { ...node, '@id': id } })
      }
      if (typeof node['@id'] !== 'string') node['@id'] = id
      for (const key of keys) {
        if (key !== '@id' && key !== '@type') visit(node[key], id)
      }
    }
  }

  visit(expanded)
  return nodes
}

function nodeOfType(nodes: Map<string, GraphNode>, type: string): GraphNode | undefined {
  for (const node of nodes.values()) if (node.types.includes(type)) return node
  return undefined
}

function resolve(nodes: Map<string, GraphNode>, id: string | undefined): GraphNode | undefined {
  return id ? nodes.get(id) : undefined
}

function propertyEndingWith(node: Node, suffix: string): string | undefined {
  return Object.keys(node).find((key) => key.endsWith(suffix))
}

/** First value of a property whose IRI ends with the given suffix, regardless of WCAG version prefix. */
function nodeIdsByProperty(node: Node, suffix: string): string[] {
  const key = propertyEndingWith(node, suffix)
  return key ? iris(node, key) : []
}

function uniqueSlug(base: string, used: Set<string>): string {
  let candidate = base || 'sample'
  let counter = 2
  while (used.has(candidate)) candidate = `${base || 'sample'}-${counter++}`
  used.add(candidate)
  return candidate
}

interface SampleIndex {
  pages: SamplePage[]
  /** Node id or source URL to sample id. */
  byRef: Map<string, string>
  used: Set<string>
}

function sampleIdFromNode(
  graphNode: GraphNode,
  page: { title: string; source: string | undefined },
  index: SampleIndex
): string {
  const { title, source } = page
  const [, ownId] = /^_:sample-(.+)$/.exec(graphNode.id) ?? []
  const fromSource = source ? toSlug(source.replace(/^https?:\/\//, '')) : ''
  const fromTitle = title && title !== source ? toSlug(title) : ''
  return uniqueSlug(ownId ?? (fromTitle || fromSource || 'sample'), index.used)
}

function registerSample(graphNode: GraphNode, index: SampleIndex, tested?: boolean): string {
  const known = index.byRef.get(graphNode.id)
  if (known) return known
  const { node } = graphNode
  const source = iris(node, `${DCT}source`)[0] ?? literal(node, `${DCT}source`)
  const knownBySource = source ? index.byRef.get(source) : undefined
  if (knownBySource) {
    index.byRef.set(graphNode.id, knownBySource)
    return knownBySource
  }
  const title = literal(node, `${DCT}title`) ?? source ?? graphNode.id
  const id = sampleIdFromNode(graphNode, { title, source }, index)
  const page: SamplePage = {
    id,
    title,
    url: source ?? '',
    description: literal(node, `${DCT}description`) ?? ''
  }
  if (tested === false && page.description === '') page.description = 'Not yet tested'
  index.pages.push(page)
  index.byRef.set(graphNode.id, id)
  if (source) index.byRef.set(source, id)
  return id
}

/**
 * Resolves the subject of an assertion to a sample id. Web pages become
 * samples; the product as a whole maps to a synthetic `product` sample.
 */
function sampleForSubject(
  subjectId: string,
  context: { nodes: Map<string, GraphNode>; index: SampleIndex; product: { ensure: () => string } }
): string {
  const { nodes, index, product } = context
  const known = index.byRef.get(subjectId)
  if (known) return known
  const graphNode = nodes.get(subjectId)
  if (graphNode) {
    if (graphNode.types.some((type) => WEB_SITE_TYPES.has(type))) return product.ensure()
    const isPage =
      graphNode.types.some((type) => WEB_PAGE_TYPES.has(type)) ||
      graphNode.types.includes(`${EARL}TestSubject`) ||
      literal(graphNode.node, `${DCT}title`) !== undefined ||
      iris(graphNode.node, `${DCT}source`).length > 0
    if (isPage) return registerSample(graphNode, index)
    return product.ensure()
  }
  if (/^https?:\/\//.test(subjectId)) {
    // A bare URL as subject: treat it as a page.
    const id = uniqueSlug(toSlug(subjectId.replace(/^https?:\/\//, '')), index.used)
    index.pages.push({ id, title: subjectId, url: subjectId, description: '' })
    index.byRef.set(subjectId, id)
    return id
  }
  return product.ensure()
}

function enumValue<T extends string>(
  value: string | undefined,
  allowed: Set<string>
): T | undefined {
  if (!value) return undefined
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  return allowed.has(normalized) ? (normalized as T) : undefined
}

/**
 * Reads an EARL document (JSON-LD, any context) into a WCAGify report with
 * issues. Works with WCAGify exports, W3C WCAG-EM Report Tool exports and
 * assertion lists from automated tools such as axe-core.
 */
async function parseEarlReport(
  document: unknown,
  options: ParseEarlOptions = {}
): Promise<EarlImport> {
  const doc = typeof document === 'string' ? (JSON.parse(document) as unknown) : document
  if (!doc || typeof doc !== 'object') {
    throw new Error('EARL document must be a JSON object')
  }

  const expanded = await jsonld.expand(doc as never)
  const nodes = collectNodes(expanded)
  const warnings: string[] = []

  const evaluationNode = nodeOfType(nodes, `${WCAGEM}Evaluation`)
  const evaluation = evaluationNode?.node ?? {}

  // --- Scope (Step 1)
  const scopeNode = resolve(nodes, iris(evaluation, `${WCAGEM}step1`)[0])?.node ?? {}
  const websiteNode = resolve(nodes, nodeIdsByProperty(scopeNode, 'dfn-set-of-web-pages')[0])
  const siteScopeLines = splitLines(literal(websiteNode?.node ?? {}, `${WCAGEM}step1a`))
  const scope = siteScopeLines.filter((line) => !/^excluded:\s*/i.test(line))
  const outOfScope = siteScopeLines
    .filter((line) => /^excluded:\s*/i.test(line))
    .map((line) => line.replace(/^excluded:\s*/i, ''))
  const siteName = websiteNode
    ? SCHEMA_NAME.map((iri) => literal(websiteNode.node, iri)).find(Boolean)
    : undefined

  // --- Samples (Step 3)
  const index: SampleIndex = { pages: [], byRef: new Map(), used: new Set() }
  for (const step of ['step3a', 'step3b']) {
    for (const sampleId of iris(evaluation, `${WCAGEM}${step}`)) {
      const sampleNode = resolve(nodes, sampleId)
      if (!sampleNode) continue
      for (const pageId of nodeIdsByProperty(sampleNode.node, 'dfn-web-page-s')) {
        const page = resolve(nodes, pageId)
        if (page) registerSample(page, index)
      }
    }
  }
  if (websiteNode) index.byRef.set(websiteNode.id, PRODUCT_SAMPLE_ID)
  const product = {
    ensure: (): string => {
      if (!index.used.has(PRODUCT_SAMPLE_ID)) {
        index.used.add(PRODUCT_SAMPLE_ID)
        index.pages.push({
          id: PRODUCT_SAMPLE_ID,
          title: siteName ?? literal(evaluation, `${DCT}title`) ?? 'Whole product',
          url: scope[0] ?? '',
          description: 'Findings that apply to the product as a whole'
        })
      }
      return PRODUCT_SAMPLE_ID
    }
  }
  if (websiteNode) index.byRef.delete(websiteNode.id)

  // --- Assertions (Step 4)
  const assertions = [...nodes.values()].filter((n) => n.types.includes(`${EARL}Assertion`))
  const partIds = new Set(assertions.flatMap((a) => iris(a.node, `${DCT}hasPart`)))
  const parentOf = new Map<string, GraphNode>()
  for (const assertion of assertions) {
    for (const partId of iris(assertion.node, `${DCT}hasPart`)) parentOf.set(partId, assertion)
  }

  const unknownTests = new Set<string>()

  const testCriteria = (assertion: GraphNode): { sc: string; version: WcagVersion }[] => {
    const testIds = [
      ...iris(assertion.node, `${EARL}test`),
      ...iris(assertion.node, `${WCAGEM}testcase`)
    ]
    const found: { sc: string; version: WcagVersion }[] = []
    for (const testId of testIds) {
      const direct = criterionFromIri(testId)
      if (direct) {
        found.push(direct)
        continue
      }
      const testNode = resolve(nodes, testId)
      const partOf = testNode ? iris(testNode.node, `${DCT}isPartOf`) : []
      for (const iri of partOf) {
        const criterion = criterionFromIri(iri)
        if (criterion) found.push(criterion)
      }
      if (found.length === 0 && testId) unknownTests.add(testId)
    }
    if (found.length === 0) {
      const parent = parentOf.get(assertion.id)
      if (parent) return testCriteria(parent)
    }
    return found
  }

  const versionsSeen = new Set<WcagVersion>()
  const outcomesBySc = new Map<string, Set<string>>()
  const issues: ImportedIssue[] = []
  let assertionCount = 0

  for (const assertion of assertions) {
    const criteria = testCriteria(assertion)
    if (criteria.length === 0) continue
    assertionCount++
    for (const { version } of criteria) versionsSeen.add(version)

    const resultNode = resolve(nodes, iris(assertion.node, `${EARL}result`)[0])?.node ?? {}
    const status = outcomeStatus(iris(resultNode, `${EARL}outcome`)[0])
    if (!status) continue

    for (const { sc } of criteria) {
      let set = outcomesBySc.get(sc)
      if (!set) outcomesBySc.set(sc, (set = new Set()))
      set.add(status)
    }
    if (status !== 'failed') continue

    // A criterion-level assertion whose failed parts are imported separately is skipped.
    const failedParts = iris(assertion.node, `${DCT}hasPart`).some((partId) => {
      const part = resolve(nodes, partId)
      const partResult = resolve(nodes, iris(part?.node ?? {}, `${EARL}result`)[0])?.node ?? {}
      return outcomeStatus(iris(partResult, `${EARL}outcome`)[0]) === 'failed'
    })
    if (failedParts) continue

    const subjects = iris(assertion.node, `${EARL}subject`)
    const sampleIds =
      subjects.length > 0
        ? subjects.map((subjectId) => sampleForSubject(subjectId, { nodes, index, product }))
        : [product.ensure()]

    const testNode = resolve(nodes, iris(assertion.node, `${EARL}test`)[0])
    const testTitle = testNode ? literal(testNode.node, `${DCT}title`) : undefined
    const description = literal(resultNode, `${DCT}description`) ?? ''
    const bodyParts = [description]
    if (testNode && testTitle && !partIds.has(assertion.id)) {
      const testIri = testNode.id.startsWith('_:') ? '' : ` (${testNode.id})`
      bodyParts.push(`Test: ${testTitle}${testIri}`)
    }
    const pointer = literal(resultNode, `${EARL}pointer`) ?? literal(resultNode, `${EARL}info`)
    if (pointer) bodyParts.push(pointer)
    const body = bodyParts.filter(Boolean).join('\n\n')

    for (const { sc } of criteria) {
      const version = criteria.find((c) => c.sc === sc)?.version ?? '2.2'
      const title =
        literal(resultNode, `${DCT}title`) ??
        testTitle ??
        `${scName(sc, version, options.language ?? 'en')} failed`
      for (const sampleId of new Set(sampleIds)) {
        const issue: ImportedIssue = { title, sc, sample: sampleId, body }
        const severity = enumValue<ImportedIssue['severity'] & string>(
          literal(resultNode, `${WCAGIFY}severity`),
          SEVERITIES
        )
        const type = enumValue<ImportedIssue['type'] & string>(
          literal(resultNode, `${WCAGIFY}issueType`),
          ISSUE_TYPES
        )
        const difficulty = enumValue<ImportedIssue['difficulty'] & string>(
          literal(resultNode, `${WCAGIFY}difficulty`),
          SEVERITIES
        )
        if (severity) issue.severity = severity
        if (type) issue.type = type
        if (difficulty) issue.difficulty = difficulty
        issues.push(issue)
      }
    }
  }

  // --- Recorded outcomes for criteria without issues
  const failedScs = new Set(issues.map((issue) => issue.sc))
  const scStatuses: ImportedReport['scStatuses'] = { passed: [], 'not-present': [] }
  for (const [sc, statuses] of [...outcomesBySc.entries()].toSorted(([a], [b]) => sortSc(a, b))) {
    if (failedScs.has(sc)) continue
    if (statuses.has('failed')) {
      warnings.push(
        `Criterion ${sc} is reported as failed without a description; it was not imported as an issue.`
      )
      continue
    }
    if (statuses.has('cant-tell')) {
      warnings.push(`Criterion ${sc} has a "cannot tell" outcome and stays not tested.`)
      continue
    }
    if (statuses.has('passed')) scStatuses.passed.push(sc)
    else if (statuses.has('not-present')) scStatuses['not-present'].push(sc)
  }
  for (const testId of unknownTests) {
    warnings.push(`Test ${testId} could not be mapped to a WCAG success criterion and was skipped.`)
  }

  // --- Metadata (Step 5.1)
  // Without an evaluation date, fall back to the most recent result date.
  const latestResultDate = assertions
    .map((a) => resolve(nodes, iris(a.node, `${EARL}result`)[0])?.node)
    .map((result) => (result ? literal(result, `${DCT}date`) : undefined))
    .map((date) => /^\d{4}-\d{2}-\d{2}/.exec(date ?? '')?.[0])
    .filter((date): date is string => Boolean(date))
    .toSorted()
    .at(-1)
  const explicitVersion = literal(evaluation, `${WCAGIFY}wcagVersion`)
  const targetWcagVersion: WcagVersion =
    explicitVersion && explicitVersion in scToSlug
      ? (explicitVersion as WcagVersion)
      : ([...versionsSeen].toSorted().at(-1) ?? '2.2')
  const targetLevel = levelFromIri(iris(scopeNode, `${WCAGEM}step1b`)[0]) ?? 'AA'
  if (!evaluationNode) {
    warnings.push('No WCAG-EM evaluation metadata found; report details use placeholders.')
  }

  const creatorNode = resolve(nodes, iris(evaluation, `${DCT}creator`)[0])
  const assertorNode = assertions
    .map((a) => resolve(nodes, iris(a.node, `${EARL}assertedBy`)[0]))
    .find((node) => node && literal(node.node, `${FOAF}name`))
  const evaluator =
    (creatorNode && literal(creatorNode.node, `${FOAF}name`)) ??
    literal(evaluation, `${DCT}creator`) ??
    (assertorNode && literal(assertorNode.node, `${FOAF}name`)) ??
    ''

  const docLanguage =
    literal(evaluation, `${DCT}language`) ??
    expanded
      .flatMap((n: Node) => values(n, `${DCT}title`))
      .map((v) =>
        v && typeof v === 'object' && '@language' in v ? String((v as Node)['@language']) : ''
      )
      .find(Boolean)
  const language: 'en' | 'nl' =
    options.language ?? (docLanguage?.toLowerCase().startsWith('nl') ? 'nl' : 'en')

  const title = literal(evaluation, `${DCT}title`) ?? siteName ?? 'Imported evaluation'
  const technologies = nodeIdsByProperty(evaluation, 'dfn-relied-upon')
    .map((id) => resolve(nodes, id))
    .map((node) => (node ? (literal(node.node, `${DCT}title`) ?? localName(node.id)) : ''))
    .filter(Boolean)

  const report: ImportedReport = {
    title,
    description: '',
    language,
    evaluation: {
      evaluator,
      commissioner: literal(evaluation, `${WCAGEM}commissioner`) ?? '',
      target: siteName ?? '',
      targetLevel,
      targetWcagVersion,
      date:
        literal(evaluation, `${DCT}date`) ??
        latestResultDate ??
        new Date().toISOString().slice(0, 10),
      specialRequirements: literal(scopeNode, `${WCAGEM}step1d`) ?? ''
    },
    scope,
    outOfScope,
    baseline: splitLines(literal(scopeNode, `${WCAGEM}step1c`)),
    technologies,
    sample: index.pages,
    scStatuses,
    summary: literal(evaluation, `${DCT}summary`) ?? ''
  }

  return {
    report,
    issues,
    warnings,
    stats: {
      assertions: assertionCount,
      criteriaWithOutcome: outcomesBySc.size,
      unknownTests: [...unknownTests]
    }
  }
}

/**
 * Lists the issues of an import with the criterion and sample names, so a
 * person or an agent can decide which ones to import.
 */
function listImportedIssues(imported: EarlImport): ImportedIssueSummary[] {
  const { targetWcagVersion } = imported.report.evaluation
  const pages = new Map(imported.report.sample.map((page) => [page.id, page]))
  return imported.issues.map((issue, index) => {
    const page = pages.get(issue.sample)
    const summary: ImportedIssueSummary = {
      index,
      title: issue.title,
      sc: issue.sc,
      scName: scName(issue.sc, targetWcagVersion, imported.report.language),
      sample: issue.sample,
      sampleTitle: page?.title ?? issue.sample,
      sampleUrl: page?.url ?? ''
    }
    if (issue.severity) summary.severity = issue.severity
    if (issue.type) summary.type = issue.type
    return summary
  })
}

/**
 * Returns a copy of an import without the issues at the given indices (as
 * listed by `listImportedIssues`). Criteria that lose all their issues end
 * up without a recorded outcome, so they count as not tested.
 */
function selectImportedIssues(imported: EarlImport, skipIndices: Iterable<number>): EarlImport {
  const skip = new Set(skipIndices)
  const issues = imported.issues.filter((_, index) => !skip.has(index))
  const skipped = imported.issues.length - issues.length
  const warnings =
    skipped > 0
      ? [...imported.warnings, `${skipped} issue(s) were left out on request.`]
      : imported.warnings
  return { ...imported, issues, warnings }
}

export {
  parseEarlReport,
  listImportedIssues,
  selectImportedIssues,
  criterionFromIri,
  outcomeStatus
}
export type { EarlImport, ImportedReport, ImportedIssue, ImportedIssueSummary, ParseEarlOptions }
