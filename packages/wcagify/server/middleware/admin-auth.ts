import type { H3Event } from 'h3'
import { getAdminSecret, verifySignedToken } from '../utils/auth'

/*
 * What a visitor without the admin cookie may load: the sign-in page, share links and
 * what those pages need from Nuxt. List exact prefixes, never a bare `/__nuxt`: that also
 * matched `/__nuxt_content/<collection>/sql_dump.txt`, which returns whole collections.
 *
 * - `/_nuxt/`: build assets.
 * - `/__nuxt_error`: Nuxt renders the error page (an unknown share link) by fetching this
 *   route on the server, through this middleware.
 * - `/_i18n/`: interface messages, loaded per language.
 * - `/api/_nuxt_icon/`: icon data for icons first rendered in the browser, such as the
 *   report's icons after a share password is entered.
 * - `/_ipx/`: images resized by @nuxt/image, for projects that add it.
 */
const PUBLIC_PREFIXES = [
  '/api/share/',
  '/api/admin/',
  '/share/',
  '/_nuxt/',
  '/_ipx/',
  '/_i18n/',
  '/api/_nuxt_icon/'
]
const PUBLIC_PATHS = ['/login', '/favicon.ico', '/__nuxt_error']

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || PUBLIC_PATHS.includes(pathname)
  )
}

/*
 * Nuxt Content's data routes: each collection's SQL dump and its query endpoint. Every
 * server-side `queryCollection()` is a local POST to `/__nuxt_content/<collection>/query`
 * that forwards the visitor's headers, so a share link's API route reaches them without an
 * admin cookie. Nitro hands the outer request's `event.context` to such a local fetch as
 * `req.__unenv__`; a client cannot set it. So a content request made while the server
 * handles a request this middleware let through is let through too. One from outside is not.
 */
const CONTENT_PREFIX = '/__nuxt_content/'
const ACCESS_GRANTED = 'wcagifyAccessGranted'

type EventContext = Record<string, unknown>

function isGrantedByOuterRequest(event: H3Event, pathname: string): boolean {
  if (!pathname.startsWith(CONTENT_PREFIX)) return false
  // eslint-disable-next-line no-underscore-dangle -- Nitro's name for the outer request's context
  const outer = (event.node.req as { __unenv__?: EventContext }).__unenv__
  return outer?.[ACCESS_GRANTED] === true
}

function hasAccess(event: H3Event, pathname: string): boolean {
  if (isPublicRoute(pathname) || isGrantedByOuterRequest(event, pathname)) return true

  const secret = getAdminSecret()
  if (!secret) return true

  const cookie = getCookie(event, 'wcagify-admin')
  if (cookie && verifySignedToken(cookie, secret)) return true

  if (cookie) {
    deleteCookie(event, 'wcagify-admin', { path: '/' })
  }
  return false
}

function isDataRoute(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname.startsWith(CONTENT_PREFIX)
}

export default defineEventHandler((event) => {
  const { pathname, search } = getRequestURL(event)

  if (hasAccess(event, pathname)) {
    event.context[ACCESS_GRANTED] = true
    return
  }

  if (isDataRoute(pathname)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return sendRedirect(event, `/login?redirect=${encodeURIComponent(pathname + search)}`)
})
