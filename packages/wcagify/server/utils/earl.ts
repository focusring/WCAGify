import type { H3Event } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { buildEarlReport, earlFileName } from '@focusring/wcagify/earl'
import type { EarlIssueSource, EarlReportSource } from '@focusring/wcagify/earl'
import pkg from '../../package.json' with { type: 'json' }

/**
 * Loads a report with its issues and returns its EARL JSON-LD export,
 * ready to be sent as `application/ld+json`.
 */
async function loadEarlExport(event: H3Event, reportPath: string) {
  const report = await queryCollection(event, 'reports').path(reportPath).first()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  const issues = await queryCollection(event, 'issues')
    .where('path', 'LIKE', `${reportPath}/%`)
    .all()

  const earl = buildEarlReport(
    report as unknown as EarlReportSource,
    issues as unknown as EarlIssueSource[],
    { baseUrl: getRequestURL(event).origin, version: pkg.version }
  )

  return { earl, filename: earlFileName(report.title) }
}

function sendEarlExport(event: H3Event, earl: object, filename: string): string {
  setHeader(event, 'Content-Type', 'application/ld+json; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  return JSON.stringify(earl, undefined, 2)
}

export { loadEarlExport, sendEarlExport }
