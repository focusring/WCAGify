import { createSignedToken, getShareByToken, verifySharePassword } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const share = getShareByToken(token)
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found or expired' })
  }

  if (!share.password_hash) {
    return { ok: true }
  }

  const body = await readBody<{ password?: string }>(event)
  const password = body?.password

  if (!password || !verifySharePassword(share, password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  const unlockValue = createSignedToken(token, share.password_hash)

  setCookie(event, `share-unlock-${token}`, unlockValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/'
  })

  return { ok: true }
})
