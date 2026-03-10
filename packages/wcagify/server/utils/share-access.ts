import type { H3Event } from 'h3'
import type { ShareRow } from './shares'
import { verifySignedToken } from './auth'
import { getShareByToken } from './shares'

async function requireShare(event: H3Event): Promise<ShareRow> {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const share = await getShareByToken(token)
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found or expired' })
  }

  return share
}

function verifyShareUnlock(event: H3Event, share: ShareRow): boolean {
  if (!share.password_hash) return true
  const unlockCookie = getCookie(event, `share-unlock-${share.token}`)
  const verifiedToken = unlockCookie
    ? verifySignedToken(unlockCookie, share.password_hash)
    : undefined
  return verifiedToken === share.token
}

export { requireShare, verifyShareUnlock }
