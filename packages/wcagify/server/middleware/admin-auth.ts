import { getAdminSecret, verifySignedToken } from '../utils/auth'

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

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

export default defineEventHandler((event) => {
  const { pathname } = getRequestURL(event)

  if (isPublicRoute(pathname)) return

  const secret = getAdminSecret()

  if (!secret) return

  const cookie = getCookie(event, 'wcagify-admin')
  if (cookie && verifySignedToken(cookie, secret)) return

  if (cookie) {
    deleteCookie(event, 'wcagify-admin', { path: '/' })
  }

  if (isApiRoute(pathname)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return sendRedirect(event, '/login')
})
