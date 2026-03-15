import { readFile, access } from 'node:fs/promises'
import { extname } from 'node:path'

const EXT_MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

const SAFE_FILENAME = /^[a-f0-9-]+\.\w+$/

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  if (!filename || !SAFE_FILENAME.test(filename)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  const { filepath } = resolveSecurePath(['public', 'uploads'], filename)

  try {
    await access(filepath)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const data = await readFile(filepath)
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
