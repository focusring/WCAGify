interface SamplePage {
  title: string
  id: string
  url: string
  description: string
}

interface Report {
  slug: string
  title: string
  sample: SamplePage[]
  wcagVersion: '2.0' | '2.1' | '2.2'
  targetLevel: 'A' | 'AA' | 'AAA'
}

export type { SamplePage, Report }
