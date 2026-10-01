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
  /**
   * Criteria with no matching content in the sample. They are satisfied, so
   * they do not change the counts; the option is kept so that callers can
   * pass a report's `scStatuses` straight through.
   */
  scStatuses?: ScStatuses | null
}

/**
 * Normalizes recorded outcomes to a map keyed by success criterion number.
 * Accepts the `not-present` list used in report frontmatter as well as a map
 * keyed by criterion. Only `not-present` is meaningful: passing is the
 * default and failing is recorded by issues, so any other recorded value is
 * ignored.
 */
function normalizeScStatuses(scStatuses: ScStatuses | null | undefined): ScStatusMap {
  if (!scStatuses) return {}
  const { 'not-present': notPresent, ...rest } = scStatuses as Record<string, unknown>
  const map: ScStatusMap = {}
  for (const [sc, status] of Object.entries(rest)) {
    if (status === 'not-present') map[sc] = 'not-present'
  }
  if (Array.isArray(notPresent)) for (const sc of notPresent) map[String(sc)] = 'not-present'
  return map
}

/**
 * Resolves the WCAG-EM Step 4 outcome of a success criterion across the whole
 * sample set.
 *
 * The evaluation is all or nothing: one issue on one sample page fails the
 * criterion for the entire evaluation. A criterion with no matching content
 * anywhere in the sample is not present, which WCAG-EM deems satisfied.
 * Everything else passed.
 */
function resolveScStatus(sc: string, hasIssues: boolean, scStatuses: ScStatusMap = {}): ScStatus {
  if (hasIssues) return 'failed'
  return scStatuses[sc] === 'not-present' ? 'not-present' : 'passed'
}

/** Zeroed counts per principle plus a total. */
function emptyCounts(): PrincipleCounts & { all: number } {
  return { all: 0, perceivable: 0, operable: 0, understandable: 0, robust: 0 }
}

/**
 * Counts, per principle and in total, how many success criteria at the
 * target level are satisfied and how many failed. Following WCAG-EM Step 4 a
 * criterion fails when any issue is recorded against it anywhere in the
 * sample; every other criterion is satisfied, whether it passed or is not
 * present.
 */
function scorecard(
  issues: { sc: string }[],
  targetLevel: Level,
  options: ScorecardOptions = {}
): Scorecard {
  const { wcagVersion = '2.2' } = options
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

  for (const [sc, entry] of Object.entries(scEntries)) {
    if (entry.obsolete && wcagVersion === '2.2') continue
    if (!includedLevels.includes(entry.level)) continue
    if (!failedScs.has(sc)) continue

    failed.all++
    failed[scPrinciple(sc)]++
  }

  const conforming = emptyCounts()
  for (const key of ['all', ...PRINCIPLES] as const) {
    conforming[key] = totals[key] - failed[key]
  }

  return { conforming, failed, totals }
}

/** Scorecard plus whether every criterion at the target level is met. */
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

const SCORECARD_KEYS = ['conforming', 'failed', 'totals'] as const

/** Difference of two scorecards, used to isolate one conformance level. */
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

/**
 * Scorecards per conformance level up to the target level (A, then AA, then
 * AAA), each counting only the criteria of that level, plus the cumulative
 * total for the target level.
 */
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
