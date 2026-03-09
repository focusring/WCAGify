import { randomBytes } from 'node:crypto'
import { createSignedToken, getAdminSecret } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const secret = getAdminSecret()
  if (!secret) {
    throw createError({ statusCode: 404, statusMessage: 'Admin not configured' })
  }

  const body = await readBody<{ secret?: string }>(event)
  if (!body?.secret || body.secret !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid admin secret' })
  }

  const sessionId = randomBytes(16).toString('hex')
  const token = createSignedToken(sessionId, secret)

  setCookie(event, 'wcagify-admin', token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  return { ok: true }
})
