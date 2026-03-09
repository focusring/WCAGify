import Database from 'better-sqlite3'
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import { nanoid } from 'nanoid'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

interface ShareRow {
  token: string
  report_slug: string
  created_at: string
  expires_at: string | null
  password_hash: string | null
  delete_token: string
}

interface Share {
  token: string
  report_slug: string
  created_at: string
  expires_at: string | null
  password_hash: boolean
  delete_token: string
}

function toPublicShare(row: ShareRow): Share {
  return {
    token: row.token,
    report_slug: row.report_slug,
    created_at: row.created_at,
    expires_at: row.expires_at,
    password_hash: Boolean(row.password_hash),
    delete_token: row.delete_token
  }
}

interface Migration {
  version: number
  up: (instance: Database.Database) => void
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (instance) => {
      instance.exec(`
        CREATE TABLE IF NOT EXISTS shares (
          token TEXT PRIMARY KEY,
          report_slug TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT,
          password_hash TEXT,
          delete_token TEXT NOT NULL
        )
      `)
      instance.exec(`CREATE INDEX IF NOT EXISTS idx_shares_report_slug ON shares(report_slug)`)
    }
  }
]

function runMigrations(instance: Database.Database): void {
  const currentVersion = (instance.pragma('user_version', { simple: true }) as number) ?? 0

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .toSorted((a, b) => a.version - b.version)

  for (const migration of pending) {
    instance.transaction(() => {
      migration.up(instance)
      instance.pragma(`user_version = ${migration.version}`)
    })()
  }
}

let sharesDb: Database.Database | undefined = undefined

function getSharesDb(): Database.Database {
  if (sharesDb) return sharesDb

  const dbPath = join(process.cwd(), '.data', 'shares.sqlite')
  mkdirSync(dirname(dbPath), { recursive: true })
  sharesDb = new Database(dbPath)
  sharesDb.pragma('journal_mode = WAL')

  runMigrations(sharesDb)

  return sharesDb
}

const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH = 32
const SALT_LENGTH = 16

function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const dk = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
  return `${salt.toString('hex')}:${dk.toString('hex')}`
}

function verifyPassword(stored: string, password: string): boolean {
  const [saltHex, dkHex] = stored.split(':')
  if (!saltHex || !dkHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const storedDk = Buffer.from(dkHex, 'hex')
  const dk = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
  return timingSafeEqual(storedDk, dk)
}

function normalizeExpiresAt(expiresAt?: string): string | undefined {
  if (!expiresAt) return undefined
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999Z` : expiresAt
  if (Number.isNaN(Date.parse(candidate))) return undefined
  return candidate
}

function createShare(reportSlug: string, expiresAt?: string, password?: string): Share {
  const conn = getSharesDb()
  const token = nanoid(12)
  const deleteToken = nanoid(24)
  const passwordHash = password ? hashPassword(password) : undefined
  const normalizedExpiry = normalizeExpiresAt(expiresAt)

  conn
    .prepare(
      'INSERT INTO shares (token, report_slug, expires_at, password_hash, delete_token) VALUES (?, ?, ?, ?, ?)'
    )
    .run(token, reportSlug, normalizedExpiry, passwordHash, deleteToken)

  const row = conn.prepare('SELECT * FROM shares WHERE token = ?').get(token) as ShareRow
  return toPublicShare(row)
}

function getShareByToken(token: string): ShareRow | undefined {
  const conn = getSharesDb()
  const share = conn.prepare('SELECT * FROM shares WHERE token = ?').get(token) as
    | ShareRow
    | undefined

  if (share?.expires_at && new Date(share.expires_at) < new Date()) {
    return undefined
  }

  return share
}

function verifySharePassword(share: ShareRow, password: string): boolean {
  if (!share.password_hash) return true
  return verifyPassword(share.password_hash, password)
}

function listSharesByReport(reportSlug: string): Share[] {
  const conn = getSharesDb()
  const rows = conn
    .prepare('SELECT * FROM shares WHERE report_slug = ? ORDER BY created_at DESC')
    .all(reportSlug) as ShareRow[]
  return rows.map(toPublicShare)
}

function deleteShare(token: string, deleteToken: string): boolean {
  const conn = getSharesDb()
  const result = conn
    .prepare('DELETE FROM shares WHERE token = ? AND delete_token = ?')
    .run(token, deleteToken)
  return result.changes > 0
}

function resetSharesDb(): void {
  if (sharesDb) {
    sharesDb.close()
    sharesDb = undefined
  }
}

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

function verifySignedToken(token: string, secret: string): string | undefined {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return undefined
  const payload = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  if (signature.length !== expected.length) return undefined
  if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex')))
    return undefined
  return payload
}

export {
  createShare,
  createSignedToken,
  deleteShare,
  getAdminSecret,
  getShareByToken,
  hashPassword,
  isAdminConfigured,
  listSharesByReport,
  normalizeExpiresAt,
  resetSharesDb,
  toPublicShare,
  verifySharePassword,
  verifySignedToken
}
export type { Share, ShareRow }
