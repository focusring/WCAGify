import { getAdminSecret, verifySignedToken } from '../utils/shares'

const PUBLIC_PREFIXES = ['/api/share/', '/api/admin/', '/share/', '/_nuxt/', '/_ipx/', '/__nuxt']
const PUBLIC_PATHS = ['/login', '/favicon.ico']

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || PUBLIC_PATHS.includes(pathname)
  )
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname

  if (isPublicRoute(pathname)) return

  const secret = getAdminSecret()

  if (!secret) {
    if (import.meta.dev) return

    if (isApiRoute(pathname)) {
      throw createError({ statusCode: 503, statusMessage: 'Admin not configured' })
    }
    return sendRedirect(event, '/login')
  }

  const cookie = getCookie(event, 'wcagify-admin')
  if (cookie && verifySignedToken(cookie, secret)) return

  if (isApiRoute(pathname)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return sendRedirect(event, '/login')
})
