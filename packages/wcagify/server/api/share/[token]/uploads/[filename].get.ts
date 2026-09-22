import { extname } from 'node:path'
import { requireShare, verifyShareUnlock } from '../../../../utils/share-access'

const EXT_MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

const SAFE_FILENAME = /^[a-z0-9-]+\.\w+$/

export default defineEventHandler(async (event) => {
  const share = await requireShare(event)

  if (!verifyShareUnlock(event, share)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const filename = getRouterParam(event, 'filename')
  if (!filename || !SAFE_FILENAME.test(filename)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  /*
   * The report comes from the share record, never from the request, so a token reaches
   * only the evidence of the report it was issued for. Revoking the share revokes the
   * evidence with it.
   */
  const data = await useStorage('assets:uploads').getItemRaw<Uint8Array>(
    `${share.report_slug}/${filename}`
  )

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
