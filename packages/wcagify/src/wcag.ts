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
  Scorecard
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

function scorecard(
  issues: { sc: string }[],
  targetLevel: Level,
  wcagVersion: WcagVersion = '2.2'
): Scorecard {
  const totals = totalsPerLevel[wcagVersion][targetLevel] as PrincipleCounts & { all: number }

  const failedScs = new Set(issues.map((issue) => issue.sc))

  const scEntries = scToSlug[wcagVersion].en as Record<string, ScEntry>
  const includedLevels = levelIncludes[targetLevel]

  let totalFailed = 0
  const failedPerPrinciple: PrincipleCounts = {
    perceivable: 0,
    operable: 0,
    understandable: 0,
    robust: 0
  }

  for (const [sc, entry] of Object.entries(scEntries)) {
    if (entry.obsolete && wcagVersion === '2.2') continue
    if (!includedLevels.includes(entry.level)) continue
    if (!failedScs.has(sc)) continue

    totalFailed++
    failedPerPrinciple[scPrinciple(sc)]++
  }

  return {
    conforming: {
      all: totals.all - totalFailed,
      perceivable: totals.perceivable - failedPerPrinciple.perceivable,
      operable: totals.operable - failedPerPrinciple.operable,
      understandable: totals.understandable - failedPerPrinciple.understandable,
      robust: totals.robust - failedPerPrinciple.robust
    },
    totals
  }
}

function conformanceSummary(
  issues: { sc: string }[],
  targetLevel: Level,
  wcagVersion: WcagVersion = '2.2'
): Scorecard & { isFullyConforming: boolean } {
  const data = scorecard(issues, targetLevel, wcagVersion)
  return {
    ...data,
    isFullyConforming: data.conforming.all === data.totals.all
  }
}

function subtractScorecard(a: Scorecard, b: Scorecard): Scorecard {
  const conforming = { all: a.conforming.all - b.conforming.all } as Scorecard['conforming']
  const totals = { all: a.totals.all - b.totals.all } as Scorecard['totals']

  for (const p of PRINCIPLES) {
    conforming[p] = a.conforming[p] - b.conforming[p]
    totals[p] = a.totals[p] - b.totals[p]
  }

  return { conforming, totals }
}

const levelHierarchy: Level[] = ['A', 'AA', 'AAA']

function scorecardByLevel(
  issues: { sc: string }[],
  targetLevel: Level,
  wcagVersion: WcagVersion = '2.2'
): { levels: Level[]; perLevel: Map<Level, Scorecard>; total: Scorecard } {
  const levels = levelHierarchy.slice(0, levelHierarchy.indexOf(targetLevel) + 1)

  const cumulative = new Map<Level, Scorecard>()
  for (const level of levels) {
    cumulative.set(level, scorecard(issues, level, wcagVersion))
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

export {
  PRINCIPLES,
  scUri,
  scName,
  guidelineName,
  allScEntries,
  scorecard,
  conformanceSummary,
  scorecardByLevel,
  levelIncludes
}
