import { createHmac, timingSafeEqual } from 'node:crypto'

function getAdminSecret(): string | undefined {
  return process.env.WCAGIFY_ADMIN_SECRET || undefined
}

function isAdminConfigured(): boolean {
  return Boolean(process.env.WCAGIFY_ADMIN_SECRET)
}

function createSignedToken(payload: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${signature}`
}

const HEX_RE = /^[\da-f]+$/i

function verifySignedToken(token: string, secret: string): string | undefined {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return undefined
  const payload = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)
  if (!HEX_RE.test(signature)) return undefined
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  if (signature.length !== expected.length) return undefined
  if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex')))
    return undefined
  return payload
}

export { createSignedToken, getAdminSecret, isAdminConfigured, verifySignedToken }
