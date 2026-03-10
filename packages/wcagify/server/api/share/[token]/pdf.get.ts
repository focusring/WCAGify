import { queryCollection } from '@nuxt/content/server'
import { generateReportPdf } from '@focusring/wcagify/pdf'
import { createAuthLocalFetch } from '../../../utils/local-fetch'
import { requireShare, verifyShareUnlock } from '../../../utils/share-access'

export default defineEventHandler(async (event) => {
  const share = await requireShare(event)

  if (!verifyShareUnlock(event, share)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const report = await queryCollection(event, 'reports')
    .path(`/reports/${share.report_slug}`)
    .first()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  const config = useRuntimeConfig()
  const filename = `${report.title}.pdf`
  const { localFetch } = useNitroApp()
  const baseUrl = getRequestURL(event).origin

  const pdfBuffer = await generateReportPdf({
    slug: share.report_slug,
    filename,
    weasyprintUrl: config.weasyprintUrl,
    baseUrl,
    localFetch: createAuthLocalFetch(localFetch),
    reportPath: `/reports/${share.report_slug}`
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  return pdfBuffer
})
