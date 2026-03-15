import { describe, it, expect } from 'vitest'
import { evaluationSchema, samplePageSchema, reportSchema, issueSchema } from '../../src/schemas'

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
