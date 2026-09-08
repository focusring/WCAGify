import scToSlug from './data/sc-to-slug.json'
import guidelines from './data/guidelines.json'
import totalsPerLevel from './data/totals-per-level.json'
import type {
  WcagVersion,
  Language,
  Level,
  Principle,
  ScEntry,
  PrincipleCounts,
  Scorecard,
  ScStatus,
  ScStatusMap,
  ScStatuses
} from './types'

const levelIncludes: Record<Level, Level[]> = {
  A: ['A'],
  AA: ['A', 'AA'],
  AAA: ['A', 'AA', 'AAA']
}

const principleMap: Record<string, Principle> = {
  1: 'perceivable',
  2: 'operable',
  3: 'understandable',
  4: 'robust'
}

function scPrinciple(sc: string): Principle {
  return principleMap[sc.charAt(0)] as Principle
}

function getScEntry(sc: string, wcagVersion: WcagVersion, language: Language): ScEntry | undefined {
  return scToSlug[wcagVersion]?.[language]?.[
    sc as keyof (typeof scToSlug)[WcagVersion][Language]
  ] as ScEntry | undefined
}

const PRINCIPLES = ['perceivable', 'operable', 'understandable', 'robust'] as const

function scUri(sc: string, wcagVersion: WcagVersion = '2.2', language: Language = 'en'): string {
  const entry = getScEntry(sc, wcagVersion, language)
  if (!entry) return ''
  return `https://www.w3.org/WAI/WCAG${wcagVersion.replace('.', '')}/quickref/#${entry.slug}`
}

function scName(sc: string, wcagVersion: WcagVersion = '2.2', language: Language = 'en'): string {
  const entry = getScEntry(sc, wcagVersion, language)
  if (!entry) return sc
  return `${sc}: ${entry.name}`
}

interface ScorecardOptions {
  wcagVersion?: WcagVersion
  /** Recorded outcomes for criteria without issues (`passed` or `not-present`). */
  scStatuses?: ScStatuses
}

/**
 * Normalizes recorded outcomes to a map keyed by success criterion number.
 * Accepts the list shape used in report frontmatter (`passed` and
 * `not-present` lists) as well as an already keyed map.
 */
function normalizeScStatuses(scStatuses: ScStatuses | null | undefined): ScStatusMap {
  if (!scStatuses) return {}
  const { passed, 'not-present': notPresent, ...rest } = scStatuses as Record<string, unknown>
  const map: ScStatusMap = {}
  for (const [sc, status] of Object.entries(rest)) {
    if (typeof status === 'string') map[sc] = status
  }
  if (Array.isArray(passed)) for (const sc of passed) map[String(sc)] = 'passed'
  if (Array.isArray(notPresent)) for (const sc of notPresent) map[String(sc)] = 'not-present'
  return map
}

/**
 * Resolves the WCAG-EM outcome of a success criterion.
 * A criterion with one or more issues has failed. Without issues it takes the
 * recorded outcome (`passed` or `not-present`). Without a recorded outcome it
 * is `not-tested`, which WCAG-EM does not count as met.
 */
function resolveScStatus(sc: string, hasIssues: boolean, scStatuses: ScStatusMap = {}): ScStatus {
  if (hasIssues) return 'failed'
  const recorded = scStatuses[sc]
  if (recorded === 'passed' || recorded === 'not-present') return recorded
  return 'not-tested'
}

function emptyCounts(): PrincipleCounts & { all: number } {
  return { all: 0, perceivable: 0, operable: 0, understandable: 0, robust: 0 }
}

function scorecard(
  issues: { sc: string }[],
  targetLevel: Level,
  options: ScorecardOptions = {}
): Scorecard {
  const { wcagVersion = '2.2' } = options
  const scStatuses = normalizeScStatuses(options.scStatuses)
  const totals = totalsPerLevel[wcagVersion]?.[targetLevel] as
    | (PrincipleCounts & { all: number })
    | undefined
  if (!totals) {
    throw new Error(`Unsupported WCAG version or level: WCAG ${wcagVersion} level ${targetLevel}`)
  }

  const failedScs = new Set(issues.map((issue) => issue.sc))

  const scEntries = scToSlug[wcagVersion].en as Record<string, ScEntry>
  const includedLevels = levelIncludes[targetLevel]

  const failed = emptyCounts()
  const notTested = emptyCounts()

  for (const [sc, entry] of Object.entries(scEntries)) {
    if (entry.obsolete && wcagVersion === '2.2') continue
    if (!includedLevels.includes(entry.level)) continue

    const status = resolveScStatus(sc, failedScs.has(sc), scStatuses)
    if (status === 'failed') {
      failed.all++
      failed[scPrinciple(sc)]++
    } else if (status === 'not-tested') {
      notTested.all++
      notTested[scPrinciple(sc)]++
    }
  }

  const conforming = emptyCounts()
  for (const key of ['all', ...PRINCIPLES] as const) {
    conforming[key] = totals[key] - failed[key] - notTested[key]
  }

  return { conforming, failed, notTested, totals }
}

function conformanceSummary(
  issues: { sc: string }[],
  targetLevel: Level,
  options: ScorecardOptions = {}
): Scorecard & { isFullyConforming: boolean } {
  const data = scorecard(issues, targetLevel, options)
  return {
    ...data,
    isFullyConforming: data.conforming.all === data.totals.all
  }
}

const SCORECARD_KEYS = ['conforming', 'failed', 'notTested', 'totals'] as const

function subtractScorecard(a: Scorecard, b: Scorecard): Scorecard {
  const result = {} as Scorecard
  for (const key of SCORECARD_KEYS) {
    const counts = emptyCounts()
    for (const field of ['all', ...PRINCIPLES] as const) {
      counts[field] = a[key][field] - b[key][field]
    }
    result[key] = counts
  }
  return result
}

const levelHierarchy: Level[] = ['A', 'AA', 'AAA']

function scorecardByLevel(
  issues: { sc: string }[],
  targetLevel: Level,
  options: ScorecardOptions = {}
): { levels: Level[]; perLevel: Map<Level, Scorecard>; total: Scorecard } {
  const levels = levelHierarchy.slice(0, levelHierarchy.indexOf(targetLevel) + 1)

  const cumulative = new Map<Level, Scorecard>()
  for (const level of levels) {
    cumulative.set(level, scorecard(issues, level, options))
  }

  const perLevel = new Map<Level, Scorecard>()
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]!
    const current = cumulative.get(level)!

    if (i === 0) {
      perLevel.set(level, current)
    } else {
      const prev = cumulative.get(levels[i - 1]!)!
      perLevel.set(level, subtractScorecard(current, prev))
    }
  }

  return { levels, perLevel, total: cumulative.get(targetLevel)! }
}

function guidelineName(
  guideline: string,
  wcagVersion: WcagVersion = '2.2',
  language: Language = 'en'
): string {
  const versionData = guidelines[wcagVersion]?.[language] as Record<string, string> | undefined
  return versionData?.[guideline] ?? guideline
}

function allScEntries(
  wcagVersion: WcagVersion = '2.2',
  language: Language = 'en'
): Record<string, ScEntry> {
  return (scToSlug[wcagVersion]?.[language] ?? {}) as Record<string, ScEntry>
}

export type { ScorecardOptions }

export {
  PRINCIPLES,
  scUri,
  scName,
  guidelineName,
  allScEntries,
  normalizeScStatuses,
  resolveScStatus,
  scorecard,
  conformanceSummary,
  scorecardByLevel,
  levelIncludes
}
