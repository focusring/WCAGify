import { describe, it, expect, vi, afterEach } from 'vitest'
import { slugPattern, generateReportMarkdown } from '../../../src/cli/report-template'

describe('slugPattern', () => {
  it.each(['my-report', 'report', 'a', 'my-audit-2024', '123', 'a-b-c'])(
    'accepts valid slug: %s',
    (slug) => {
      expect(slugPattern.test(slug)).toBe(true)
    }
  )

  it.each([
    '',
    'My-Report',
    'my_report',
    '-leading',
    'trailing-',
    'double--dash',
    'has space',
    'special!char',
    'UPPERCASE'
  ])('rejects invalid slug: %s', (slug) => {
    expect(slugPattern.test(slug)).toBe(false)
  })
})

describe('generateReportMarkdown', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns valid YAML frontmatter', () => {
    const md = generateReportMarkdown('test-report')
    expect(md).toMatch(/^---\n/)
    expect(md).toMatch(/\n---\n$/)
  })

  it('uses the slug as title', () => {
    const md = generateReportMarkdown('my-audit')
    expect(md).toContain('title: my-audit')
  })

  it('uses today as evaluation date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))

    const md = generateReportMarkdown('test')
    expect(md).toContain('date: 2025-06-15')
  })

  it('includes all required frontmatter fields', () => {
    const md = generateReportMarkdown('test')
    expect(md).toContain('baseline:')
    expect(md).toContain('evaluation:')
    expect(md).toContain('language: nl')
    expect(md).toContain('sample:')
    expect(md).toContain('scope:')
    expect(md).toContain('technologies:')
  })

  it('includes default baseline entries', () => {
    const md = generateReportMarkdown('test')
    expect(md).toContain('Windows 11 with Chrome and NVDA')
    expect(md).toContain('macOS with Safari and VoiceOver')
    expect(md).toContain('Android with Chrome and TalkBack')
  })

  it('sets targetLevel to AA', () => {
    const md = generateReportMarkdown('test')
    expect(md).toContain('targetLevel: AA')
  })

  it('sets targetWcagVersion to 2.1', () => {
    const md = generateReportMarkdown('test')
    expect(md).toContain("targetWcagVersion: '2.1'")
  })
})
