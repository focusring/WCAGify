import { describe, it, expect } from 'vitest'
import {
  evaluationSchema,
  samplePageSchema,
  scStatusesSchema,
  reportSchema,
  issueSchema
} from '../../src/schemas'

describe('evaluationSchema', () => {
  const valid = {
    evaluator: 'John',
    commissioner: 'Acme',
    target: 'https://example.com',
    targetLevel: 'AA',
    targetWcagVersion: '2.2',
    date: '2025-01-01',
    specialRequirements: 'none'
  }

  it('accepts valid data', () => {
    expect(evaluationSchema.parse(valid)).toEqual(valid)
  })

  it('rejects missing fields', () => {
    expect(() => evaluationSchema.parse({})).toThrow()
  })

  it('rejects non-string fields', () => {
    expect(() => evaluationSchema.parse({ ...valid, evaluator: 123 })).toThrow()
  })

  it('accepts all supported WCAG versions and levels', () => {
    for (const targetWcagVersion of ['2.0', '2.1', '2.2']) {
      expect(evaluationSchema.parse({ ...valid, targetWcagVersion })).toHaveProperty(
        'targetWcagVersion',
        targetWcagVersion
      )
    }
    for (const targetLevel of ['A', 'AA', 'AAA']) {
      expect(evaluationSchema.parse({ ...valid, targetLevel })).toHaveProperty(
        'targetLevel',
        targetLevel
      )
    }
  })

  it('rejects an unsupported WCAG version or level', () => {
    expect(() => evaluationSchema.parse({ ...valid, targetWcagVersion: '2.3' })).toThrow()
    expect(() => evaluationSchema.parse({ ...valid, targetWcagVersion: '3.0' })).toThrow()
    expect(() => evaluationSchema.parse({ ...valid, targetLevel: 'AAAA' })).toThrow()
  })
})

describe('samplePageSchema', () => {
  const valid = { title: 'Home', id: 'home', url: 'https://example.com', description: 'Main page' }

  it('accepts valid data', () => {
    expect(samplePageSchema.parse(valid)).toEqual(valid)
  })

  it('rejects missing fields', () => {
    expect(() => samplePageSchema.parse({ title: 'Home' })).toThrow()
  })
})

describe('issueSchema', () => {
  const valid = { sc: '1.1.1', severity: 'High', difficulty: 'Medium', sample: 'home' }

  it('accepts valid data', () => {
    expect(issueSchema.parse(valid)).toEqual(valid)
  })

  it('rejects invalid severity', () => {
    expect(() => issueSchema.parse({ ...valid, severity: 'Critical' })).toThrow()
  })

  it('rejects invalid difficulty', () => {
    expect(() => issueSchema.parse({ ...valid, difficulty: 'Extreme' })).toThrow()
  })

  it('accepts all valid severity values', () => {
    for (const severity of ['Low', 'Medium', 'High']) {
      expect(issueSchema.parse({ ...valid, severity })).toHaveProperty('severity', severity)
    }
  })

  it('accepts all valid difficulty values', () => {
    for (const difficulty of ['Low', 'Medium', 'High']) {
      expect(issueSchema.parse({ ...valid, difficulty })).toHaveProperty('difficulty', difficulty)
    }
  })
})

describe('scStatusesSchema', () => {
  it('accepts passed and not-present lists', () => {
    expect(scStatusesSchema.parse({ passed: ['1.1.1'], 'not-present': ['1.2.1'] })).toEqual({
      passed: ['1.1.1'],
      'not-present': ['1.2.1']
    })
  })

  it('accepts an empty object', () => {
    expect(scStatusesSchema.parse({})).toEqual({})
  })

  it('rejects non-list values', () => {
    expect(() => scStatusesSchema.parse({ passed: '1.1.1' })).toThrow()
  })

  it('keeps a legacy map keyed by criterion instead of stripping it', () => {
    expect(scStatusesSchema.parse({ '1.1.1': 'passed', '1.2.1': 'not-present' })).toEqual({
      '1.1.1': 'passed',
      '1.2.1': 'not-present'
    })
  })
})

describe('reportSchema', () => {
  const valid = {
    language: 'en',
    evaluation: {
      evaluator: 'John',
      commissioner: 'Acme',
      target: 'https://example.com',
      targetLevel: 'AA',
      targetWcagVersion: '2.2',
      date: '2025-01-01',
      specialRequirements: 'none'
    },
    scope: ['https://example.com'],
    baseline: ['Windows/Chrome/NVDA'],
    technologies: ['HTML'],
    sample: [{ title: 'Home', id: 'home', url: 'https://example.com', description: 'Main page' }]
  }

  it('accepts valid data', () => {
    expect(reportSchema.parse(valid)).toBeDefined()
  })

  it('rejects invalid language', () => {
    expect(() => reportSchema.parse({ ...valid, language: 'fr' })).toThrow()
  })

  it('accepts nl language', () => {
    expect(reportSchema.parse({ ...valid, language: 'nl' })).toHaveProperty('language', 'nl')
  })

  it('allows optional outOfScope', () => {
    expect(
      reportSchema.parse({ ...valid, outOfScope: ['https://example.com/admin'] })
    ).toBeDefined()
  })

  it('works without outOfScope', () => {
    // valid already lacks outOfScope — just confirm it parses
    expect(reportSchema.parse(valid)).toBeDefined()
  })
})
