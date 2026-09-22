import { extname } from 'node:path'

const EXT_MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

const SAFE_FILENAME = /^[a-z0-9-]+\.\w+$/

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  if (!filename || !SAFE_FILENAME.test(filename)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  /*
   * Freshly uploaded images, before an issue is saved and they are moved into their
   * report folder. Read from server assets for the same reason as the report route.
   */
  const data = await useStorage('assets:uploads').getItemRaw<Uint8Array>(filename)

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
