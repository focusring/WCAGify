import { listSharesByReport } from '../../utils/shares'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const reportSlug = query.reportSlug as string | undefined

  if (!reportSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing reportSlug query parameter' })
  }

  return listSharesByReport(reportSlug)
})
