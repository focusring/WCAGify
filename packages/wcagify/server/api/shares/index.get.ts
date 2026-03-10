import { listSharesByReport, reportSlugSchema } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reportSlug = query.reportSlug as string | undefined

  if (!reportSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing reportSlug query parameter' })
  }

  const result = reportSlugSchema.safeParse(reportSlug)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid reportSlug' })
  }

  return await listSharesByReport(result.data)
})
