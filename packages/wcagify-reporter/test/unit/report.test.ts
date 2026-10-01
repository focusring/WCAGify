import { describe, it, expect } from 'vitest'
import { resolveSamplePage } from '../../src/report'
import type { SamplePage } from '../../src/types'

const sample: SamplePage[] = [
  { id: 'home', title: 'Homepage', url: 'https://example.com', description: 'Main page' },
  {
    id: 'contact',
    title: 'Contact',
    url: 'https://example.com/contact',
    description: 'Contact page'
  }
]

describe('resolveSamplePage', () => {
  it('finds a page by id', () => {
    expect(resolveSamplePage(sample, 'home')).toEqual(sample[0])
  })

  it('returns undefined for unknown id', () => {
    expect(resolveSamplePage(sample, 'unknown')).toBeUndefined()
  })

  it('returns undefined for empty array', () => {
    expect(resolveSamplePage([], 'home')).toBeUndefined()
  })
})
