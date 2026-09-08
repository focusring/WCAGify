import type scToSlug from './data/sc-to-slug.json'

type WcagVersion = keyof typeof scToSlug
type Language = keyof (typeof scToSlug)['2.2']
type Level = 'A' | 'AA' | 'AAA'
type ScStatus = 'passed' | 'failed' | 'not-present' | 'not-tested'

/** Recorded outcome per success criterion number. */
type ScStatusMap = Record<string, string | undefined>

/** Recorded outcomes as lists of success criterion numbers, as authored in report frontmatter. */
interface ScStatusLists {
  passed?: string[]
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
  /** Criteria counted as met: recorded as passed or not present. */
  conforming: PrincipleCounts & { all: number }
  /** Criteria with one or more issues. */
  failed: PrincipleCounts & { all: number }
  /** Criteria without a recorded outcome. Not counted as met. */
  notTested: PrincipleCounts & { all: number }
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
