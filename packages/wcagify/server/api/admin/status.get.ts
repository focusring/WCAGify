import { getAdminSecret, verifySignedToken } from '../../utils/shares'

export default defineEventHandler((event) => {
  const secret = getAdminSecret()
  const configured = Boolean(secret)
  let authenticated = false

  if (secret) {
    const cookie = getCookie(event, 'wcagify-admin')
    authenticated = Boolean(cookie && verifySignedToken(cookie, secret))
  }

  return {
    configured,
    authenticated,
    dev: import.meta.dev
  }
})
