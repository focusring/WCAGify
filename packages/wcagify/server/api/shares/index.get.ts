import { isValidSlug, listSharesByReport } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reportSlug = query.reportSlug as string | undefined

  if (!reportSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing reportSlug query parameter' })
  }

  if (!isValidSlug(reportSlug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid reportSlug' })
  }

  return await listSharesByReport(reportSlug)
})
