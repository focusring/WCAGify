export interface SamplePage {
  title: string
  id: string
  url: string
  description: string
}

export interface Report {
  slug: string
  title: string
  sample: SamplePage[]
}
