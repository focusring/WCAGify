import { getAdminSecret, verifySignedToken } from '../utils/shares'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/shares')) return

  const secret = getAdminSecret()
  if (!secret) {
    throw createError({ statusCode: 401, statusMessage: 'Admin not configured' })
  }

  const cookie = getCookie(event, 'wcagify-admin')
  if (cookie && verifySignedToken(cookie, secret)) return

  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
})
