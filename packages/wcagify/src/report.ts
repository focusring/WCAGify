import type { SamplePage } from './types'

export function resolveSamplePage(sample: SamplePage[], sampleId: string): SamplePage | undefined {
  return sample.find((page) => page.id === sampleId)
}
