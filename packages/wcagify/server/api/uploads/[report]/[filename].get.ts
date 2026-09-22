import { extname } from 'node:path'

const EXT_MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

const SAFE_FILENAME = /^[a-z0-9-]+\.\w+$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default defineEventHandler(async (event) => {
  const report = getRouterParam(event, 'report')
  const filename = getRouterParam(event, 'filename')

  if (!report || !SLUG_PATTERN.test(report)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report slug' })
  }

  if (!filename || !SAFE_FILENAME.test(filename)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  /*
   * Server assets, not the filesystem: `public/` is not on the server's disk on a
   * serverless host, and these images must stay behind auth rather than be served
   * statically. The patterns above already exclude traversal from the storage key.
   */
  const data = await useStorage('assets:uploads').getItemRaw<Uint8Array>(`${report}/${filename}`)

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const contentType = EXT_MIME_MAP[extname(filename).toLowerCase()] || 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(
    event,
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'"
  )
  setResponseHeader(event, 'Cache-Control', 'private, max-age=31536000, immutable')

  return data
})
