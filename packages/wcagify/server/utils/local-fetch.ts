import { randomBytes } from 'node:crypto'
import { createSignedToken, getAdminSecret } from './shares'

type LocalFetch = (url: string, init?: RequestInit) => Promise<Response>

function createAuthLocalFetch(localFetch: LocalFetch): LocalFetch {
  const secret = getAdminSecret()
  if (!secret) return localFetch

  const sessionId = randomBytes(16).toString('hex')
  const token = createSignedToken(sessionId, secret)

  return (url, init) =>
    localFetch(url, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init?.headers)),
        cookie: `wcagify-admin=${token}`
      }
    })
}

export { createAuthLocalFetch }
