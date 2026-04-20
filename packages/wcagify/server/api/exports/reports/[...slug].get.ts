import { queryCollection } from '@nuxt/content/server'
import { buildEarl } from '@focusring/wcagify/earl'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing report slug' })
  }

  const reportPath = `/reports/${slug}`
  const report = await queryCollection(event, 'reports').path(reportPath).first()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  const issues = await queryCollection(event, 'issues')
    .where('path', 'LIKE', `${reportPath}/%`)
    .all()

  const baseUrl = getRequestURL(event).origin
  const document = buildEarl({
    report: report as unknown as Parameters<typeof buildEarl>[0]['report'],
    issues: issues as unknown as Parameters<typeof buildEarl>[0]['issues'],
    slug,
    baseUrl
  })

  const safeTitle = (report.title ?? 'report').replace(/[^\w.-]+/g, '_')
  setHeader(event, 'Content-Type', 'application/ld+json')
  setHeader(event, 'Content-Disposition', `attachment; filename="${safeTitle}-evaluation.json"`)
  return JSON.stringify(document, undefined, 2)
})
