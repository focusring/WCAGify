import { createSignedToken } from '../../utils/auth'
import { requireShare } from '../../utils/share-access'
import { verifySharePassword } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const share = await requireShare(event)

  if (!share.password_hash) {
    return { ok: true }
  }

  const body = await readBody<{ password?: string }>(event)
  const password = body?.password

  if (!password || !verifySharePassword(share, password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  const unlockValue = createSignedToken(share.token, share.password_hash)

  setCookie(event, `share-unlock-${share.token}`, unlockValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/'
  })

  return { ok: true }
})
