import { writeFile, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])

/* eslint-disable unicorn/number-literal-case -- oxfmt enforces lowercase hex; keep consistent with formatter */
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]] // RIFF header
}
/* eslint-enable unicorn/number-literal-case */

function validateMagicBytes(data: Buffer, mime: string): boolean {
  const signatures = MAGIC_BYTES[mime]
  if (!signatures) return false
  return signatures.some((sig) => sig.every((byte, i) => data[i] === byte))
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No form data provided' })
  }

  const fileField = formData.find((f) => f.name === 'file')
  if (!fileField || !fileField.data || !fileField.type) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  if (!ALLOWED_TYPES.has(fileField.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `File type "${fileField.type}" is not allowed`
    })
  }

  if (fileField.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'File exceeds 2MB limit' })
  }

  if (!validateMagicBytes(fileField.data, fileField.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File content does not match declared type'
    })
  }

  const webpData = await sharp(fileField.data).webp({ quality: 80 }).toBuffer()

  const filename = `${randomUUID()}.webp`
  const { dir: uploadsDir, filepath } = resolveSecurePath(['public', 'uploads'], filename)
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(filepath, webpData)

  return {
    url: `/api/uploads/${filename}`
  }
})
