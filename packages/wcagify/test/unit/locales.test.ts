import { describe, it, expect } from 'vitest'
import en from '../../locales/en'
import nl from '../../locales/nl'

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys.sort()
}

describe('locale files', () => {
  const enKeys = getKeys(en)
  const nlKeys = getKeys(nl)

  it('en locale has keys', () => {
    expect(enKeys.length).toBeGreaterThan(0)
  })

  it('nl locale has keys', () => {
    expect(nlKeys.length).toBeGreaterThan(0)
  })

  it('en and nl have the same keys', () => {
    expect(enKeys).toEqual(nlKeys)
  })

  it('no empty string values in en', () => {
    for (const key of enKeys) {
      const value = key.split('.').reduce((obj: any, k) => obj[k], en)
      expect(value, `en.${key} should not be empty`).not.toBe('')
    }
  })

  it('no empty string values in nl', () => {
    for (const key of nlKeys) {
      const value = key.split('.').reduce((obj: any, k) => obj[k], nl)
      expect(value, `nl.${key} should not be empty`).not.toBe('')
    }
  })

  it('all values are strings', () => {
    for (const key of enKeys) {
      const value = key.split('.').reduce((obj: any, k) => obj[k], en)
      expect(typeof value, `en.${key} should be a string`).toBe('string')
    }
    for (const key of nlKeys) {
      const value = key.split('.').reduce((obj: any, k) => obj[k], nl)
      expect(typeof value, `nl.${key} should be a string`).toBe('string')
    }
  })
})
