import type scToSlug from './data/sc-to-slug.json'

type WcagVersion = keyof typeof scToSlug
type Language = keyof (typeof scToSlug)['2.2']
type Level = 'A' | 'AA' | 'AAA'
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
  conforming: PrincipleCounts & { all: number }
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

export type {
  WcagVersion,
  Language,
  Level,
  Principle,
  ScEntry,
  PrincipleCounts,
  Scorecard,
  SamplePage,
  IssueGroup
}
