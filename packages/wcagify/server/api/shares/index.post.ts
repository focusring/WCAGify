import { createShare } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ reportSlug: string; expiresAt?: string; password?: string }>(event)

  if (!body?.reportSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing reportSlug' })
  }

  const share = createShare(body.reportSlug, body.expiresAt, body.password)
  setResponseStatus(event, 201)
  return share
})
