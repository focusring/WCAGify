import type { H3Event } from 'h3'

const CHUNK_SIZE = 64 * 1024

/**
 * Sends a generated PDF as a download, streamed in chunks.
 *
 * A report with its screenshots embedded runs to several megabytes. Serverless
 * hosts cap a buffered function response (Vercel at 4.5 MB) but not a streamed
 * one, so the bytes go out as a stream instead of one body.
 */
export function sendPdf(event: H3Event, pdf: Uint8Array, filename: string) {
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)

  let offset = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= pdf.length) {
        controller.close()
        return
      }
      controller.enqueue(pdf.subarray(offset, offset + CHUNK_SIZE))
      offset += CHUNK_SIZE
    }
  })
  return sendStream(event, stream)
}
