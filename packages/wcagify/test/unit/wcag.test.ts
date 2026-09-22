import { describe, it, expect } from 'vitest'
import {
  scUri,
  scName,
  scorecard,
  conformanceSummary,
  scorecardByLevel,
  PRINCIPLES,
  guidelineName,
  allScEntries,
  resolveScStatus,
  normalizeScStatuses
} from '../../src/wcag'
import type { ScStatuses } from '../../src/types'

describe('PRINCIPLES', () => {
  it('contains all four WCAG principles', () => {
    expect(PRINCIPLES).toEqual(['perceivable', 'operable', 'understandable', 'robust'])
  })
})

describe('scUri', () => {
  it('returns a W3C quickref URL for a known SC', () => {
    const uri = scUri('1.1.1', '2.2', 'en')
    expect(uri).toBe('https://www.w3.org/WAI/WCAG22/quickref/#non-text-content')
  })

  it('returns empty string for an unknown SC', () => {
    expect(scUri('99.99.99')).toBe('')
  })

  it('uses default version 2.2 and language en', () => {
    expect(scUri('1.1.1')).toBe('https://www.w3.org/WAI/WCAG22/quickref/#non-text-content')
  })

  it('handles WCAG 2.1', () => {
    const uri = scUri('1.1.1', '2.1', 'en')
    expect(uri).toBe('https://www.w3.org/WAI/WCAG21/quickref/#non-text-content')
  })

  it('handles Dutch language', () => {
    const uri = scUri('1.1.1', '2.2', 'nl')
    expect(uri).toContain('https://www.w3.org/WAI/WCAG22/quickref/#')
  })
})

describe('scName', () => {
  it('returns formatted name for a known SC', () => {
    expect(scName('1.1.1', '2.2', 'en')).toBe('1.1.1: Non-text Content')
  })

  it('returns raw SC string for unknown SC', () => {
    expect(scName('99.99.99')).toBe('99.99.99')
  })

  it('uses default version and language', () => {
    expect(scName('2.4.7')).toContain('2.4.7:')
  })
})

describe('normalizeScStatuses', () => {
  it('returns an empty map for missing input', () => {
    expect(normalizeScStatuses(undefined)).toEqual({})
    expect(normalizeScStatuses(null)).toEqual({})
  })

  it('maps the not-present list to a map keyed by criterion', () => {
    expect(normalizeScStatuses({ 'not-present': ['1.2.1', '1.2.2'] })).toEqual({
      '1.2.1': 'not-present',
      '1.2.2': 'not-present'
    })
  })

  it('passes an already keyed map through', () => {
    expect(normalizeScStatuses({ '1.2.1': 'not-present' })).toEqual({ '1.2.1': 'not-present' })
  })

  it('ignores recorded values other than not-present', () => {
    expect(normalizeScStatuses({ '1.3.1': 'passed', '2.4.9': 'not-tested' })).toEqual({})
  })

  it('ignores a legacy passed list, since passing is the default', () => {
    expect(
      normalizeScStatuses({ passed: ['1.1.1'], 'not-present': ['1.2.1'] } as ScStatuses)
    ).toEqual({ '1.2.1': 'not-present' })
  })
})

describe('resolveScStatus', () => {
  it('fails a criterion with issues, whatever was recorded', () => {
    expect(resolveScStatus('1.1.1', true)).toBe('failed')
    expect(resolveScStatus('1.2.1', true, { '1.2.1': 'not-present' })).toBe('failed')
  })

  it('returns not-present for a criterion recorded as not present', () => {
    expect(resolveScStatus('1.2.1', false, { '1.2.1': 'not-present' })).toBe('not-present')
  })

  it('passes every other criterion without issues', () => {
    expect(resolveScStatus('1.1.1', false)).toBe('passed')
    expect(resolveScStatus('1.1.1', false, {})).toBe('passed')
    expect(resolveScStatus('1.1.1', false, { '1.1.1': 'maybe' })).toBe('passed')
  })
})

describe('scorecard', () => {
  it('counts every criterion without issues as satisfied', () => {
    const result = scorecard([], 'AA', { wcagVersion: '2.2' })
    expect(result.conforming.all).toBe(result.totals.all)
    expect(result.failed.all).toBe(0)
    expect(result.totals.all).toBeGreaterThan(0)
    for (const p of PRINCIPLES) {
      expect(result.conforming[p]).toBe(result.totals[p])
    }
  })

  it('counts not-present criteria as satisfied, like passing ones', () => {
    const withNotPresent = scorecard([], 'AA', {
      wcagVersion: '2.2',
      scStatuses: { 'not-present': ['1.2.1', '1.2.2'] }
    })
    const without = scorecard([], 'AA', { wcagVersion: '2.2' })
    expect(withNotPresent.conforming.all).toBe(without.conforming.all)
    expect(withNotPresent.failed.all).toBe(0)
  })

  it('decreases conforming count for each failing SC', () => {
    const full = scorecard([], 'AA', { wcagVersion: '2.2' })
    const withIssues = scorecard([{ sc: '1.1.1' }, { sc: '2.4.7' }], 'AA', {
      wcagVersion: '2.2'
    })
    expect(withIssues.conforming.all).toBe(full.totals.all - 2)
    expect(withIssues.failed.all).toBe(2)
  })

  it('fails a criterion with issues even when it is recorded as not present', () => {
    const result = scorecard([{ sc: '1.1.1' }], 'AA', {
      wcagVersion: '2.2',
      scStatuses: { 'not-present': ['1.1.1'] }
    })
    expect(result.failed.perceivable).toBe(1)
    expect(result.conforming.perceivable).toBe(result.totals.perceivable - 1)
  })

  it('deduplicates issues with the same SC', () => {
    const result = scorecard([{ sc: '1.1.1' }, { sc: '1.1.1' }], 'AA', {
      wcagVersion: '2.2'
    })
    const full = scorecard([], 'AA', { wcagVersion: '2.2' })
    expect(result.conforming.all).toBe(full.totals.all - 1)
    expect(result.failed.all).toBe(1)
  })

  it('counts per principle correctly', () => {
    const result = scorecard([{ sc: '1.1.1' }], 'AA', {
      wcagVersion: '2.2'
    })
    const full = scorecard([], 'AA', { wcagVersion: '2.2' })
    expect(result.conforming.perceivable).toBe(full.totals.perceivable - 1)
    expect(result.conforming.operable).toBe(full.totals.operable)
    expect(result.conforming.understandable).toBe(full.totals.understandable)
    expect(result.conforming.robust).toBe(full.totals.robust)
  })

  it('always adds up: conforming + failed equals the total', () => {
    const result = scorecard([{ sc: '1.1.1' }, { sc: '2.4.7' }], 'AA', {
      wcagVersion: '2.2',
      scStatuses: { 'not-present': ['1.2.1'] }
    })
    for (const key of ['all', ...PRINCIPLES] as const) {
      expect(result.conforming[key] + result.failed[key]).toBe(result.totals[key])
    }
  })

  it('handles level A', () => {
    const result = scorecard([], 'A', { wcagVersion: '2.2' })
    expect(result.totals.all).toBeGreaterThan(0)
    expect(result.totals.all).toBeLessThan(scorecard([], 'AA', { wcagVersion: '2.2' }).totals.all)
  })

  it('ignores issues for SCs outside target level', () => {
    const aaaSc = '1.2.6'
    const result = scorecard([{ sc: aaaSc }], 'AA', { wcagVersion: '2.2' })
    const full = scorecard([], 'AA', { wcagVersion: '2.2' })
    expect(result.conforming.all).toBe(full.totals.all)
    expect(result.failed.all).toBe(0)
  })

  it('ignores the obsolete 4.1.1 for WCAG 2.2 but not for 2.1', () => {
    expect(scorecard([{ sc: '4.1.1' }], 'A', { wcagVersion: '2.2' }).failed.robust).toBe(0)
    expect(scorecard([{ sc: '4.1.1' }], 'A', { wcagVersion: '2.1' }).failed.robust).toBe(1)
  })

  it('throws a clear error for an unsupported WCAG version', () => {
    expect(() => scorecard([], 'AA', { wcagVersion: '2.3' as '2.2' })).toThrow(
      /Unsupported WCAG version/
    )
  })
})

describe('conformanceSummary', () => {
  it('reports fully conforming when all criteria passed and there are no issues', () => {
    const result = conformanceSummary([], 'AA', { wcagVersion: '2.2' })
    expect(result.isFullyConforming).toBe(true)
  })

  it('reports not fully conforming with issues', () => {
    const result = conformanceSummary([{ sc: '1.1.1' }], 'AA', {
      wcagVersion: '2.2'
    })
    expect(result.isFullyConforming).toBe(false)
  })

  it('includes scorecard data', () => {
    const result = conformanceSummary([], 'AA', { wcagVersion: '2.2' })
    expect(result).toHaveProperty('conforming')
    expect(result).toHaveProperty('failed')
    expect(result).toHaveProperty('totals')
  })
})

describe('scorecardByLevel', () => {
  it('returns individual levels for target AA', () => {
    const result = scorecardByLevel([], 'AA', { wcagVersion: '2.2' })
    expect(result.levels).toEqual(['A', 'AA'])
  })

  it('returns individual levels for target AAA', () => {
    const result = scorecardByLevel([], 'AAA', { wcagVersion: '2.2' })
    expect(result.levels).toEqual(['A', 'AA', 'AAA'])
  })

  it('returns single level for target A', () => {
    const result = scorecardByLevel([], 'A', { wcagVersion: '2.2' })
    expect(result.levels).toEqual(['A'])
  })

  it('per-level totals sum to the combined total', () => {
    const result = scorecardByLevel([], 'AA', { wcagVersion: '2.2' })
    const aData = result.perLevel.get('A')!
    const aaData = result.perLevel.get('AA')!

    expect(aData.totals.all + aaData.totals.all).toBe(result.total.totals.all)
    for (const p of PRINCIPLES) {
      expect(aData.totals[p] + aaData.totals[p]).toBe(result.total.totals[p])
    }
  })

  it('per-level conforming counts sum to the combined total', () => {
    const result = scorecardByLevel([{ sc: '1.1.1' }, { sc: '1.4.3' }], 'AA', {
      wcagVersion: '2.2'
    })
    const aData = result.perLevel.get('A')!
    const aaData = result.perLevel.get('AA')!

    expect(aData.conforming.all + aaData.conforming.all).toBe(result.total.conforming.all)
    expect(aData.failed.all).toBe(1)
    expect(aaData.failed.all).toBe(1)
  })

  it('attributes a level-A issue only to the A column', () => {
    const result = scorecardByLevel([{ sc: '1.1.1' }], 'AA', {
      wcagVersion: '2.2'
    })
    const full = scorecardByLevel([], 'AA', { wcagVersion: '2.2' })
    const aData = result.perLevel.get('A')!
    const aaData = result.perLevel.get('AA')!
    const fullA = full.perLevel.get('A')!
    const fullAA = full.perLevel.get('AA')!

    expect(aData.conforming.perceivable).toBe(fullA.totals.perceivable - 1)
    expect(aData.failed.perceivable).toBe(1)
    expect(aaData.conforming).toEqual(fullAA.totals)
  })

  it('attributes a level-AA issue only to the AA column', () => {
    const result = scorecardByLevel([{ sc: '2.4.7' }], 'AA', {
      wcagVersion: '2.2'
    })
    const full = scorecardByLevel([], 'AA', { wcagVersion: '2.2' })
    const aData = result.perLevel.get('A')!
    const aaData = result.perLevel.get('AA')!
    const fullA = full.perLevel.get('A')!
    const fullAA = full.perLevel.get('AA')!

    expect(aData.conforming).toEqual(fullA.totals)
    expect(aaData.conforming.operable).toBe(fullAA.totals.operable - 1)
    expect(aaData.failed.operable).toBe(1)
  })

  it('total matches scorecard output', () => {
    const issues = [{ sc: '1.1.1' }, { sc: '2.4.7' }]
    const statuses = { '1.3.1': 'passed' }
    const result = scorecardByLevel(issues, 'AA', { wcagVersion: '2.2', scStatuses: statuses })
    const expected = scorecard(issues, 'AA', { wcagVersion: '2.2', scStatuses: statuses })

    expect(result.total).toEqual(expected)
  })
})

describe('guidelineName', () => {
  it('returns the English name for a known guideline', () => {
    expect(guidelineName('1.1', '2.2', 'en')).toBe('Text Alternatives')
  })

  it('returns the Dutch name for a known guideline', () => {
    expect(guidelineName('1.1', '2.2', 'nl')).toBe('Tekstalternatieven')
  })

  it('returns the guideline code for an unknown guideline', () => {
    expect(guidelineName('9.9', '2.2', 'en')).toBe('9.9')
  })

  it('uses default version and language', () => {
    expect(guidelineName('2.1')).toBe('Keyboard Accessible')
  })

  it('handles WCAG 2.0', () => {
    expect(guidelineName('2.3', '2.0', 'en')).toBe('Seizures')
  })
})

describe('allScEntries', () => {
  it('returns an object with SC entries for the given version and language', () => {
    const entries = allScEntries('2.2', 'en')
    expect(entries).toHaveProperty('1.1.1')
    expect(entries['1.1.1']).toHaveProperty('name')
    expect(entries['1.1.1']).toHaveProperty('slug')
    expect(entries['1.1.1']).toHaveProperty('level')
  })

  it('uses default version and language', () => {
    const entries = allScEntries()
    expect(entries).toHaveProperty('1.1.1')
  })

  it('returns entries for WCAG 2.1', () => {
    const entries = allScEntries('2.1', 'en')
    expect(entries).toHaveProperty('1.1.1')
  })
})
