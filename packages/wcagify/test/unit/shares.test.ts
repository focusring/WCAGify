import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  hashPassword,
  verifySharePassword,
  normalizeExpiresAt,
  toPublicShare,
  getAdminSecret,
  isAdminConfigured
} from '../../server/utils/shares'
import type { ShareRow } from '../../server/utils/shares'

describe('hashPassword', () => {
  it('returns a salt:hash string', () => {
    const result = hashPassword('test123')
    const parts = result.split(':')
    expect(parts).toHaveLength(2)
    expect(parts[0]).toHaveLength(32)
    expect(parts[1]).toHaveLength(64)
  })

  it('produces different hashes for the same password (unique salt)', () => {
    const a = hashPassword('same-password')
    const b = hashPassword('same-password')
    expect(a).not.toBe(b)
  })
})

describe('verifySharePassword', () => {
  function makeRow(passwordHash: string | null): ShareRow {
    return {
      token: 'abc',
      report_slug: 'test',
      created_at: '2025-01-01',
      expires_at: null,
      password_hash: passwordHash,
      delete_token: 'del123'
    }
  }

  it('returns true when share has no password', () => {
    expect(verifySharePassword(makeRow(null), 'anything')).toBe(true)
  })

  it('returns true for correct password', () => {
    const hash = hashPassword('secret')
    expect(verifySharePassword(makeRow(hash), 'secret')).toBe(true)
  })

  it('returns false for wrong password', () => {
    const hash = hashPassword('secret')
    expect(verifySharePassword(makeRow(hash), 'wrong')).toBe(false)
  })

  it('returns false for malformed hash', () => {
    expect(verifySharePassword(makeRow('not-a-valid-hash'), 'test')).toBe(false)
  })
})

describe('normalizeExpiresAt', () => {
  it('returns undefined for undefined', () => {
    expect(normalizeExpiresAt(undefined)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(normalizeExpiresAt('')).toBeUndefined()
  })

  it('normalizes date-only string to end of day UTC', () => {
    expect(normalizeExpiresAt('2030-12-31')).toBe('2030-12-31T23:59:59.999Z')
  })

  it('passes through full datetime strings unchanged', () => {
    const full = '2030-12-31T12:00:00.000Z'
    expect(normalizeExpiresAt(full)).toBe(full)
  })

  it('returns undefined for non-date strings', () => {
    expect(normalizeExpiresAt('not-a-date')).toBeUndefined()
  })
})

describe('toPublicShare', () => {
  const baseRow: ShareRow = {
    token: 'tok123',
    report_slug: 'my-report',
    created_at: '2025-01-01T00:00:00Z',
    expires_at: '2030-12-31T23:59:59.999Z',
    password_hash: 'salt:hash',
    delete_token: 'del456'
  }

  it('converts password_hash string to true', () => {
    const result = toPublicShare(baseRow)
    expect(result.password_hash).toBe(true)
  })

  it('converts null password_hash to false', () => {
    const result = toPublicShare({ ...baseRow, password_hash: null })
    expect(result.password_hash).toBe(false)
  })

  it('preserves all other fields', () => {
    const result = toPublicShare(baseRow)
    expect(result.token).toBe('tok123')
    expect(result.report_slug).toBe('my-report')
    expect(result.created_at).toBe('2025-01-01T00:00:00Z')
    expect(result.expires_at).toBe('2030-12-31T23:59:59.999Z')
    expect(result.delete_token).toBe('del456')
  })
})

describe('getAdminSecret', () => {
  let originalSecret: string | undefined

  beforeEach(() => {
    originalSecret = process.env.WCAGIFY_ADMIN_SECRET
  })

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.WCAGIFY_ADMIN_SECRET = originalSecret
    } else {
      delete process.env.WCAGIFY_ADMIN_SECRET
    }
  })

  it('returns env var when set', () => {
    process.env.WCAGIFY_ADMIN_SECRET = 'my-secret'
    expect(getAdminSecret()).toBe('my-secret')
  })

  it('returns undefined when env var is not set', () => {
    delete process.env.WCAGIFY_ADMIN_SECRET
    expect(getAdminSecret()).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    process.env.WCAGIFY_ADMIN_SECRET = ''
    expect(getAdminSecret()).toBeUndefined()
  })
})

describe('isAdminConfigured', () => {
  let originalSecret: string | undefined

  beforeEach(() => {
    originalSecret = process.env.WCAGIFY_ADMIN_SECRET
  })

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.WCAGIFY_ADMIN_SECRET = originalSecret
    } else {
      delete process.env.WCAGIFY_ADMIN_SECRET
    }
  })

  it('returns true when env var is set', () => {
    process.env.WCAGIFY_ADMIN_SECRET = 'configured'
    expect(isAdminConfigured()).toBe(true)
  })

  it('returns false when env var is not set', () => {
    delete process.env.WCAGIFY_ADMIN_SECRET
    expect(isAdminConfigured()).toBe(false)
  })
})
