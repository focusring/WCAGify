import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import { join } from 'node:path'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import type { DbAdapter, Migration } from '../lib/db'
import { createLibsqlAdapter, createLocalAdapter, runMigrations } from '../lib/db'

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
  passwordProtected: boolean
  delete_token: string
}

function toPublicShare(row: ShareRow): Share {
  return {
    token: row.token,
    report_slug: row.report_slug,
    created_at: row.created_at,
    expires_at: row.expires_at,
    passwordProtected: Boolean(row.password_hash),
    delete_token: row.delete_token
  }
}

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS shares (
          token TEXT PRIMARY KEY,
          report_slug TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT,
          password_hash TEXT,
          delete_token TEXT NOT NULL
        )
      `)
      await db.exec('CREATE INDEX IF NOT EXISTS idx_shares_report_slug ON shares(report_slug)')
    }
  }
]

let db: DbAdapter | undefined = undefined
let dbInit: Promise<DbAdapter> | undefined = undefined

async function getDb(): Promise<DbAdapter> {
  if (db) return db
  if (!dbInit) {
    dbInit = (async () => {
      const dbUrl = process.env.DATABASE_URL
      const adapter = dbUrl
        ? await createLibsqlAdapter(dbUrl, process.env.DATABASE_AUTH_TOKEN)
        : await createLocalAdapter(
            join(process.env.VERCEL ? '/tmp' : join(process.cwd(), '.data'), 'shares.sqlite')
          )
      try {
        await runMigrations(adapter, migrations)
      } catch (error) {
        adapter.close()
        throw error
      }
      return adapter
    })().catch((error) => {
      dbInit = undefined
      throw error
    })
  }
  db = await dbInit
  return db
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

const reportSlugSchema = z.string().regex(/^[\da-z][\da-z-]*$/)

function normalizeExpiresAt(expiresAt?: string): string | undefined {
  if (!expiresAt) return undefined
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999Z` : expiresAt
  if (Number.isNaN(Date.parse(candidate))) return undefined
  return candidate
}

async function createShare(
  reportSlug: string,
  expiresAt?: string,
  password?: string
): Promise<Share> {
  const conn = await getDb()
  const token = nanoid(12)
  const deleteToken = nanoid(24)
  const passwordHash = password ? hashPassword(password) : undefined
  const normalizedExpiry = normalizeExpiresAt(expiresAt)

  await conn.run(
    'INSERT INTO shares (token, report_slug, expires_at, password_hash, delete_token) VALUES (?, ?, ?, ?, ?)',
    [token, reportSlug, normalizedExpiry, passwordHash, deleteToken]
  )

  return toPublicShare({
    token,
    report_slug: reportSlug,
    created_at: new Date().toISOString(),
    // eslint-disable-next-line unicorn/no-null -- ShareRow columns mirror SQL NULL values
    expires_at: normalizedExpiry ?? null,
    // eslint-disable-next-line unicorn/no-null -- ShareRow columns mirror SQL NULL values
    password_hash: passwordHash ?? null,
    delete_token: deleteToken
  })
}

async function getShareByToken(token: string): Promise<ShareRow | undefined> {
  const conn = await getDb()
  const share = await conn.get<ShareRow>('SELECT * FROM shares WHERE token = ?', [token])

  if (share?.expires_at && new Date(share.expires_at) < new Date()) {
    return undefined
  }

  return share
}

function verifySharePassword(share: ShareRow, password: string): boolean {
  if (!share.password_hash) return true
  return verifyPassword(share.password_hash, password)
}

async function listSharesByReport(reportSlug: string): Promise<Share[]> {
  const conn = await getDb()
  const rows = await conn.all<ShareRow>(
    "SELECT * FROM shares WHERE report_slug = ? AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY created_at DESC",
    [reportSlug]
  )
  return rows.map(toPublicShare)
}

async function deleteShare(token: string, deleteToken: string): Promise<boolean> {
  const conn = await getDb()
  const result = await conn.run('DELETE FROM shares WHERE token = ? AND delete_token = ?', [
    token,
    deleteToken
  ])
  return result.changes > 0
}

function resetSharesDb(): void {
  if (db) {
    db.close()
    db = undefined
    dbInit = undefined
  }
}

export {
  createShare,
  deleteShare,
  getShareByToken,
  hashPassword,
  listSharesByReport,
  normalizeExpiresAt,
  resetSharesDb,
  toPublicShare,
  reportSlugSchema,
  verifySharePassword
}
export type { Share, ShareRow }
