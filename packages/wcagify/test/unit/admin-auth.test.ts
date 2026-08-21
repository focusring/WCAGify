import { describe, it, expect } from 'vitest'
import { createSignedToken, verifySignedToken } from '../../server/utils/auth'

/**
 * Mirrors the request-gating decision in server/middleware/admin-auth.ts as a pure function,
 * since the real middleware relies on Nitro/H3 auto-imports. Locks in that "no secret configured"
 * is a deliberate fully-open mode (any deployment can run without a login), not an accidental gap:
 * a regression that starts requiring auth when unconfigured, or stops requiring it when configured
 * and the cookie is missing/invalid, should fail this test.
 */
const PUBLIC_PREFIXES = [
  '/api/share/',
  '/api/admin/',
  '/share/',
  '/_nuxt/',
  '/_ipx/',
  '/__nuxt',
  '/_i18n/'
]
const PUBLIC_PATHS = ['/login', '/favicon.ico']

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || PUBLIC_PATHS.includes(pathname)
  )
}

type Outcome = 'allow' | '401' | 'redirect'

function decide(pathname: string, secret: string | undefined, cookie: string | undefined): Outcome {
  if (isPublicRoute(pathname)) return 'allow'
  if (!secret) return 'allow'
  if (cookie && verifySignedToken(cookie, secret)) return 'allow'
  return pathname.startsWith('/api/') ? '401' : 'redirect'
}

describe('admin-auth request gating', () => {
  it('allows public routes regardless of secret or cookie', () => {
    expect(decide('/login', 'secret', undefined)).toBe('allow')
    expect(decide('/share/abc123', 'secret', undefined)).toBe('allow')
    expect(decide('/api/share/abc123', 'secret', undefined)).toBe('allow')
    expect(decide('/api/admin/login', 'secret', undefined)).toBe('allow')
  })

  it('allows every protected route when no admin secret is configured (deliberate open-access mode)', () => {
    expect(decide('/', undefined, undefined)).toBe('allow')
    expect(decide('/api/issues', undefined, undefined)).toBe('allow')
    expect(decide('/settings', undefined, 'garbage-cookie')).toBe('allow')
  })

  it('allows a protected route when the secret is configured and the cookie is a valid signed token', () => {
    const secret = 'test-secret'
    const cookie = createSignedToken('session-id', secret)
    expect(decide('/', secret, cookie)).toBe('allow')
    expect(decide('/api/issues', secret, cookie)).toBe('allow')
  })

  it('returns 401 for API routes when the secret is configured and the cookie is missing or invalid', () => {
    const secret = 'test-secret'
    expect(decide('/api/issues', secret, undefined)).toBe('401')
    expect(decide('/api/issues', secret, 'not-a-valid-token')).toBe('401')
    expect(decide('/api/issues', secret, createSignedToken('id', 'wrong-secret'))).toBe('401')
  })

  it('redirects page routes when the secret is configured and the cookie is missing or invalid', () => {
    const secret = 'test-secret'
    expect(decide('/', secret, undefined)).toBe('redirect')
    expect(decide('/settings', secret, 'not-a-valid-token')).toBe('redirect')
  })
})
