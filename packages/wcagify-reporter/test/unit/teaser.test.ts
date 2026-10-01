import { describe, it, expect } from 'vitest'
import { reportTeaser, teaserSchema } from '../../src/index'

function report(targetLevel: 'A' | 'AA' | 'AAA', targetWcagVersion: '2.0' | '2.1' | '2.2') {
  return {
    evaluation: {
      evaluator: 'focusring',
      commissioner: 'Acme B.V.',
      target: 'Acme customer portal',
      targetLevel,
      targetWcagVersion,
      date: '2026-10-08',
      specialRequirements: 'None'
    },
    scStatuses: { 'not-present': [] }
  }
}

const issues = [
  { sc: '1.1.1', title: 'The hero image has no text alternative' },
  { sc: '1.1.1', title: 'The logo link has no accessible name' },
  { sc: '1.4.3', title: 'Form labels are too faint' },
  { sc: 'none', title: 'Consider shorter headings' },
  { sc: '1.4.6', title: 'Body text misses 7:1' }
]

describe('reportTeaser', () => {
  it('counts the findings and the criteria met per level for the report’s target', () => {
    expect(reportTeaser(report('AA', '2.2'), issues)).toStrictEqual({
      wcagVersion: '2.2',
      targetLevel: 'AA',
      findings: 3,
      levels: [
        { level: 'A', conforming: 30, failed: 1, total: 31 },
        { level: 'AA', conforming: 23, failed: 1, total: 24 }
      ],
      total: { conforming: 53, failed: 2, total: 55 }
    })
  })

  it('leaves out tips and issues against criteria outside the target, as the report does', () => {
    const teaser = reportTeaser(report('AA', '2.1'), [
      { sc: 'none' },
      { sc: '1.4.6' },
      { sc: '2.4.11' },
      { sc: '2.1.1' }
    ])

    expect(teaser.findings).toBe(1)
    expect(teaser.total).toStrictEqual({ conforming: 49, failed: 1, total: 50 })
  })

  it('does not count an issue against a criterion obsolete in WCAG 2.2', () => {
    const teaser = reportTeaser(report('A', '2.2'), [{ sc: '4.1.1' }, { sc: '2.1.1' }])

    expect(teaser).toStrictEqual({
      wcagVersion: '2.2',
      targetLevel: 'A',
      findings: 1,
      levels: [{ level: 'A', conforming: 30, failed: 1, total: 31 }],
      total: { conforming: 30, failed: 1, total: 31 }
    })
  })

  it('counts every issue under a criterion, not only the criteria that failed', () => {
    const teaser = reportTeaser(report('AA', '2.2'), issues.slice(1))

    expect(teaser.findings).toBe(2)
    expect(teaser.total).toStrictEqual({ conforming: 53, failed: 2, total: 55 })
  })

  it('reports a level AAA target per level, with no findings when no issue is recorded', () => {
    const teaser = reportTeaser({ ...report('AAA', '2.0'), scStatuses: undefined }, [])

    expect(teaser.findings).toBe(0)
    expect(teaser.levels.map(({ level }) => level)).toStrictEqual(['A', 'AA', 'AAA'])
    expect(teaser.total.failed).toBe(0)
    expect(teaser.total.conforming).toBe(teaser.total.total)
  })

  it('survives JSON, so it can be stored in a jsonb column as is', () => {
    const teaser = reportTeaser(report('AA', '2.2'), issues)

    expect(JSON.parse(JSON.stringify(teaser))).toStrictEqual(teaser)
    expect(teaserSchema.parse(JSON.parse(JSON.stringify(teaser)))).toStrictEqual(teaser)
  })
})

describe('teaserSchema', () => {
  const teaser = reportTeaser(report('AA', '2.2'), issues)

  it('rejects anything beyond counts, so no report content can travel in a teaser', () => {
    expect(teaserSchema.safeParse({ ...teaser, title: 'Acme' }).success).toBe(false)
    expect(
      teaserSchema.safeParse({ ...teaser, total: { ...teaser.total, criteria: ['1.1.1'] } }).success
    ).toBe(false)
  })

  it('rejects negative or fractional counts and unknown levels or versions', () => {
    expect(teaserSchema.safeParse({ ...teaser, findings: -1 }).success).toBe(false)
    expect(teaserSchema.safeParse({ ...teaser, findings: 1.5 }).success).toBe(false)
    expect(teaserSchema.safeParse({ ...teaser, targetLevel: 'AAAA' }).success).toBe(false)
    expect(teaserSchema.safeParse({ ...teaser, wcagVersion: '3.0' }).success).toBe(false)
  })
})
