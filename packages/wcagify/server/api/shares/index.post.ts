import { createShare, reportSlugSchema } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ reportSlug: string; expiresAt?: string; password?: string }>(event)

  if (!body?.reportSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing reportSlug' })
  }

  const result = reportSlugSchema.safeParse(body.reportSlug)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid reportSlug' })
  }

  const share = await createShare(result.data, body.expiresAt, body.password)
  setResponseStatus(event, 201)
  return share
})
