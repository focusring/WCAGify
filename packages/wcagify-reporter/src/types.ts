import type scToSlug from './data/sc-to-slug.json'

type WcagVersion = keyof typeof scToSlug
type Language = keyof (typeof scToSlug)['2.2']
type Level = 'A' | 'AA' | 'AAA'
/**
 * WCAG-EM Step 4 outcome of a success criterion, evaluated across the whole
 * sample set. `passed` and `not-present` both count as satisfied.
 */
type ScStatus = 'passed' | 'failed' | 'not-present'

/** Recorded outcome per success criterion number. */
type ScStatusMap = Record<string, string | undefined>

/**
 * Recorded outcomes as authored in report frontmatter.
 *
 * Only criteria with no matching content anywhere in the sample are listed.
 * WCAG-EM deems those satisfied. Every other criterion passes unless an issue
 * records a failure against it, so there is nothing else to author.
 *
 * Lists are used instead of a map keyed by criterion because Nuxt Content
 * unflattens dotted keys such as `1.1.1` into nested objects.
 */
interface ScStatusLists {
  'not-present'?: string[]
}

type ScStatuses = ScStatusMap | ScStatusLists

type Principle = 'perceivable' | 'operable' | 'understandable' | 'robust'

interface ScEntry {
  slug: string
  name: string
  level: Level
  obsolete?: boolean
}

interface PrincipleCounts {
  perceivable: number
  operable: number
  understandable: number
  robust: number
}

interface Scorecard {
  /** Criteria counted as satisfied: passed or not present. */
  conforming: PrincipleCounts & { all: number }
  /** Criteria with one or more issues. */
  failed: PrincipleCounts & { all: number }
  totals: PrincipleCounts & { all: number }
}

interface SamplePage {
  title: string
  id: string
  url: string
  description: string
}

interface IssueGroup<T extends { sc: string }> {
  sc: string
  name: string
  uri: string
  issues: T[]
}

interface ScGroup<T extends { sc: string }> {
  sc: string
  name: string
  level: Level
  uri: string
  status: ScStatus
  issues: T[]
}

interface GuidelineGroup<T extends { sc: string }> {
  guideline: string
  name: string
  criteria: ScGroup<T>[]
}

interface PrincipleGroup<T extends { sc: string }> {
  principle: Principle
  number: number
  guidelines: GuidelineGroup<T>[]
}

export type {
  WcagVersion,
  Language,
  Level,
  Principle,
  ScEntry,
  PrincipleCounts,
  Scorecard,
  SamplePage,
  IssueGroup,
  ScStatus,
  ScStatusMap,
  ScStatusLists,
  ScStatuses,
  ScGroup,
  GuidelineGroup,
  PrincipleGroup
}
