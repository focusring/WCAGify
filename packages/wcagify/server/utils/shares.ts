import Database from 'better-sqlite3'
import { createHash } from 'node:crypto'
import { nanoid } from 'nanoid'
import { join } from 'node:path'

export interface Share {
  token: string
  report_slug: string
  created_at: string
  expires_at: string | null
  password_hash: string | null
}

let db: Database.Database | null = null

function getSharesDb(): Database.Database {
  if (db) return db

  const dbPath = join(process.cwd(), '.data', 'shares.sqlite')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS shares (
      token TEXT PRIMARY KEY,
      report_slug TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT,
      password_hash TEXT
    )
  `)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_shares_report_slug ON shares(report_slug)`)

  return db
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function createShare(reportSlug: string, expiresAt?: string, password?: string): Share {
  const db = getSharesDb()
  const token = nanoid(12)
  const passwordHash = password ? hashPassword(password) : null

  db.prepare(
    'INSERT INTO shares (token, report_slug, expires_at, password_hash) VALUES (?, ?, ?, ?)'
  ).run(token, reportSlug, expiresAt ?? null, passwordHash)

  return db.prepare('SELECT * FROM shares WHERE token = ?').get(token) as Share
}

export function getShareByToken(token: string): Share | undefined {
  const db = getSharesDb()
  const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(token) as Share | undefined

  if (share?.expires_at && new Date(share.expires_at) < new Date()) {
    return undefined
  }

  return share
}

export function verifySharePassword(share: Share, password: string): boolean {
  if (!share.password_hash) return true
  return share.password_hash === hashPassword(password)
}

export function listSharesByReport(reportSlug: string): Share[] {
  const db = getSharesDb()
  return db
    .prepare('SELECT * FROM shares WHERE report_slug = ? ORDER BY created_at DESC')
    .all(reportSlug) as Share[]
}

export function deleteShare(token: string): boolean {
  const db = getSharesDb()
  const result = db.prepare('DELETE FROM shares WHERE token = ?').run(token)
  return result.changes > 0
}

export function resetSharesDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
