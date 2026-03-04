import { queryCollection } from '@nuxt/content/server'
import { generateReportPdf } from 'wcagify/pdf'

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'slug.pdf')
  const slug = raw?.replace(/\.pdf$/, '')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing report slug' })
  }

  const report = await queryCollection(event, 'reports').path(`/reports/${slug}`).first()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  const config = useRuntimeConfig()
  const filename = `${report.title}.pdf`
  const { localFetch } = useNitroApp()
  const baseUrl = getRequestURL(event).origin

  const pdfBuffer = await generateReportPdf({
    slug,
    filename,
    weasyprintUrl: config.weasyprintUrl,
    baseUrl,
    localFetch
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  return pdfBuffer
})
