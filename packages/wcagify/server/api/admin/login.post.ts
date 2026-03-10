import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createSignedToken, getAdminSecret } from '../../utils/auth'

const LOGIN_WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > MAX_ATTEMPTS
}

function secretsMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return timingSafeEqual(Buffer.alloc(b.length), b) && false
  return timingSafeEqual(a, b)
}

export default defineEventHandler(async (event) => {
  const secret = getAdminSecret()
  if (!secret) {
    throw createError({ statusCode: 404, statusMessage: 'Admin not configured' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many login attempts' })
  }

  const body = await readBody<{ secret?: string }>(event)
  if (!body?.secret || !secretsMatch(body.secret, secret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid admin secret' })
  }

  const sessionId = randomBytes(16).toString('hex')
  const token = createSignedToken(sessionId, secret)

  setCookie(event, 'wcagify-admin', token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  return { ok: true }
})
