import { prepareForPdf } from './html-processor'
import { generatePdf } from './weasyprint-client'

type LocalFetch = (url: string, init?: RequestInit) => Promise<Response>

export interface ReportPdfOptions {
  slug: string
  filename: string
  weasyprintUrl: string
  baseUrl: string
  localFetch: LocalFetch
  reportPath?: string
}

export async function generateReportPdf(options: ReportPdfOptions): Promise<Uint8Array> {
  const fetchPath = options.reportPath ?? `/reports/${options.slug}`
  const pageResponse = await options.localFetch(fetchPath)
  if (!pageResponse.ok) {
    throw new Error(`Failed to fetch report page ${fetchPath}: ${pageResponse.status}`)
  }
  const ssrHtml = await pageResponse.text()
  const html = await prepareForPdf(ssrHtml, options.baseUrl)

  return generatePdf(html, options.filename, options.weasyprintUrl)
}
