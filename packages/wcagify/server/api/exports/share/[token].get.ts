import { queryCollection } from '@nuxt/content/server'
import { buildEarl } from '@focusring/wcagify/earl'
import { requireShare, verifyShareUnlock } from '../../../utils/share-access'

export default defineEventHandler(async (event) => {
  const share = await requireShare(event)

  if (!verifyShareUnlock(event, share)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const reportPath = `/reports/${share.report_slug}`
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
    slug: share.report_slug,
    baseUrl
  })

  const safeTitle = (report.title ?? 'report').replace(/[^\w.-]+/g, '_')
  setHeader(event, 'Content-Type', 'application/ld+json')
  setHeader(event, 'Content-Disposition', `attachment; filename="${safeTitle}-evaluation.json"`)
  return JSON.stringify(document, undefined, 2)
})
