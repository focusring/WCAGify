import { describe, it, expect } from 'vitest'
import {
  filterIssues,
  sortIssuesBySc,
  filterTips,
  groupIssuesBySc,
  groupIssuesByPrinciple
} from '../../src/issues'

describe('filterIssues', () => {
  it('removes items with sc=none', () => {
    const issues = [{ sc: '1.1.1' }, { sc: 'none' }, { sc: '2.4.7' }]
    expect(filterIssues(issues)).toEqual([{ sc: '1.1.1' }, { sc: '2.4.7' }])
  })

  it('returns empty array when all are tips', () => {
    expect(filterIssues([{ sc: 'none' }])).toEqual([])
  })

  it('returns all when none are tips', () => {
    const issues = [{ sc: '1.1.1' }, { sc: '2.1.1' }]
    expect(filterIssues(issues)).toEqual(issues)
  })
})

describe('sortIssuesBySc', () => {
  it('sorts numerically by SC', () => {
    const issues = [{ sc: '2.4.7' }, { sc: '1.1.1' }, { sc: '1.2.1' }]
    const sorted = sortIssuesBySc(issues)
    expect(sorted.map((i) => i.sc)).toEqual(['1.1.1', '1.2.1', '2.4.7'])
  })

  it('does not mutate the original array', () => {
    const issues = [{ sc: '2.1.1' }, { sc: '1.1.1' }]
    sortIssuesBySc(issues)
    expect(issues[0]!.sc).toBe('2.1.1')
  })

  it('handles empty array', () => {
    expect(sortIssuesBySc([])).toEqual([])
  })
})

describe('filterTips', () => {
  it('keeps only items with sc=none', () => {
    const issues = [{ sc: '1.1.1' }, { sc: 'none' }, { sc: '2.4.7' }]
    expect(filterTips(issues)).toEqual([{ sc: 'none' }])
  })

  it('returns empty array when no tips exist', () => {
    expect(filterTips([{ sc: '1.1.1' }])).toEqual([])
  })
})

describe('groupIssuesBySc', () => {
  it('groups issues by SC code', () => {
    const issues = [
      { sc: '1.1.1', title: 'a' },
      { sc: '2.4.7', title: 'b' },
      { sc: '1.1.1', title: 'c' }
    ]
    const groups = groupIssuesBySc(issues)
    expect(groups).toHaveLength(2)
    expect(groups[0]!.sc).toBe('1.1.1')
    expect(groups[0]!.issues).toHaveLength(2)
    expect(groups[1]!.sc).toBe('2.4.7')
    expect(groups[1]!.issues).toHaveLength(1)
  })

  it('enriches groups with name and uri', () => {
    const groups = groupIssuesBySc([{ sc: '1.1.1' }], '2.2', 'en')
    expect(groups[0]!.name).toContain('Non-text Content')
    expect(groups[0]!.uri).toContain('quickref')
  })

  it('filters out tips before grouping', () => {
    const issues = [{ sc: 'none' }, { sc: '1.1.1' }]
    const groups = groupIssuesBySc(issues)
    expect(groups).toHaveLength(1)
    expect(groups[0]!.sc).toBe('1.1.1')
  })

  it('returns empty array for no real issues', () => {
    expect(groupIssuesBySc([{ sc: 'none' }])).toEqual([])
  })
})

describe('groupIssuesByPrinciple', () => {
  it('returns all four principles when issues span them', () => {
    const issues = [{ sc: '1.1.1' }, { sc: '2.1.1' }, { sc: '3.1.1' }, { sc: '4.1.1' }]
    const result = groupIssuesByPrinciple(issues, 'AA')
    const principles = result.map((g) => g.principle)
    expect(principles).toEqual(['perceivable', 'operable', 'understandable', 'robust'])
  })

  it('assigns correct principle numbers', () => {
    const result = groupIssuesByPrinciple([{ sc: '1.1.1' }], 'AA')
    expect(result[0]!.number).toBe(1)
  })

  it('groups issues under the correct guideline', () => {
    const issues = [{ sc: '1.1.1' }, { sc: '1.4.3' }]
    const result = groupIssuesByPrinciple(issues, 'AA')
    const perceivable = result.find((g) => g.principle === 'perceivable')!
    const guidelineCodes = perceivable.guidelines.map((g) => g.guideline)
    expect(guidelineCodes).toContain('1.1')
    expect(guidelineCodes).toContain('1.4')
  })

  it('enriches guidelines with names', () => {
    const result = groupIssuesByPrinciple([{ sc: '1.1.1' }], 'AA', { language: 'en' })
    const guideline = result[0]!.guidelines[0]!
    expect(guideline.name).toBe('Text Alternatives')
  })

  it('enriches criteria with name, level, uri, and status', () => {
    const result = groupIssuesByPrinciple([{ sc: '1.1.1' }], 'AA')
    const criterion = result[0]!.guidelines[0]!.criteria.find((c) => c.sc === '1.1.1')!
    expect(criterion.name).toContain('Non-text Content')
    expect(criterion.level).toBe('A')
    expect(criterion.uri).toContain('quickref')
    expect(criterion.status).toBe('failed')
  })

  it('marks criteria without issues as not-tested by default', () => {
    const result = groupIssuesByPrinciple([], 'AA')
    const allCriteria = result.flatMap((p) => p.guidelines.flatMap((g) => g.criteria))
    expect(allCriteria.every((c) => c.status === 'not-tested')).toBe(true)
  })

  it('respects scStatuses for passed and not-present', () => {
    const result = groupIssuesByPrinciple([], 'AA', {
      scStatuses: { '1.1.1': 'passed', '2.1.1': 'not-present' }
    })
    const allCriteria = result.flatMap((p) => p.guidelines.flatMap((g) => g.criteria))
    expect(allCriteria.find((c) => c.sc === '1.1.1')!.status).toBe('passed')
    expect(allCriteria.find((c) => c.sc === '2.1.1')!.status).toBe('not-present')
  })

  it('issues override scStatuses (failed takes precedence)', () => {
    const result = groupIssuesByPrinciple([{ sc: '1.1.1' }], 'AA', {
      scStatuses: { '1.1.1': 'passed' }
    })
    const criterion = result[0]!.guidelines[0]!.criteria.find((c) => c.sc === '1.1.1')!
    expect(criterion.status).toBe('failed')
    expect(criterion.issues).toHaveLength(1)
  })

  it('filters out tips (sc=none)', () => {
    const result = groupIssuesByPrinciple([{ sc: 'none' }], 'AA')
    const allIssues = result.flatMap((p) =>
      p.guidelines.flatMap((g) => g.criteria.flatMap((c) => c.issues))
    )
    expect(allIssues).toHaveLength(0)
  })

  it('only includes criteria matching the target level', () => {
    const resultA = groupIssuesByPrinciple([], 'A')
    const resultAA = groupIssuesByPrinciple([], 'AA')
    const countA = resultA.flatMap((p) => p.guidelines.flatMap((g) => g.criteria)).length
    const countAA = resultAA.flatMap((p) => p.guidelines.flatMap((g) => g.criteria)).length
    expect(countAA).toBeGreaterThan(countA)
  })

  it('groups multiple issues under the same SC', () => {
    const issues = [
      { sc: '1.1.1', title: 'a' },
      { sc: '1.1.1', title: 'b' }
    ]
    const result = groupIssuesByPrinciple(issues, 'AA')
    const criterion = result[0]!.guidelines[0]!.criteria.find((c) => c.sc === '1.1.1')!
    expect(criterion.issues).toHaveLength(2)
  })

  it('supports Dutch language', () => {
    const result = groupIssuesByPrinciple([{ sc: '1.1.1' }], 'AA', { language: 'nl' })
    const guideline = result[0]!.guidelines[0]!
    expect(guideline.name).toBe('Tekstalternatieven')
  })
})
