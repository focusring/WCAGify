import { queryCollection } from '@nuxt/content/server'
import { generateReportPdf } from '@focusring/wcagify/pdf'
import { createAuthLocalFetch } from '../../../utils/local-fetch'
import { getShareByToken, verifySignedToken } from '../../../utils/shares'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const share = getShareByToken(token)
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found or expired' })
  }

  if (share.password_hash) {
    const unlockCookie = getCookie(event, `share-unlock-${token}`)
    const verifiedToken = unlockCookie
      ? verifySignedToken(unlockCookie, share.password_hash)
      : undefined
    if (verifiedToken !== token) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
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
