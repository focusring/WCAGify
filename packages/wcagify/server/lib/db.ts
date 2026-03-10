import type { InValue } from '@libsql/client'

interface DbAdapter {
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>
  get<T>(sql: string, params?: unknown[]): Promise<T | undefined>
  all<T>(sql: string, params?: unknown[]): Promise<T[]>
  exec(sql: string): Promise<void>
  getUserVersion(): Promise<number>
  setUserVersion(version: number): Promise<void>
  transaction(fn: () => Promise<void>): Promise<void>
  close(): void
}

async function createSqliteAdapter(dbPath: string): Promise<DbAdapter> {
  const { default: Database } = await import('better-sqlite3')
  const { mkdirSync } = await import('node:fs')
  const { dirname } = await import('node:path')

  mkdirSync(dirname(dbPath), { recursive: true })

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  return {
    async run(sql, params = []) {
      return { changes: db.prepare(sql).run(...params).changes }
    },
    async get<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).get(...params) as T | undefined
    },
    async all<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).all(...params) as T[]
    },
    async exec(sql) {
      db.exec(sql)
    },
    async getUserVersion() {
      return (db.pragma('user_version', { simple: true }) as number) ?? 0
    },
    async setUserVersion(version) {
      if (!Number.isInteger(version)) throw new Error(`Invalid user_version: ${version}`)
      db.pragma(`user_version = ${version}`)
    },
    async transaction(fn) {
      const run = db.transaction(() => fn())
      await run()
    },
    close() {
      db.close()
    }
  }
}

// eslint-disable-next-line unicorn/no-null -- libsql requires null, not undefined
const sanitizeParams = (params: unknown[]) =>
  params.map((p) => (p === undefined ? null : p)) as InValue[]

async function createLibsqlAdapter(url: string, authToken?: string): Promise<DbAdapter> {
  const { createClient } = await import('@libsql/client')
  const client = createClient({ url, authToken })

  return {
    async run(sql, params = []) {
      const r = await client.execute({ sql, args: sanitizeParams(params) })
      return { changes: r.rowsAffected }
    },
    async get<T>(sql: string, params: unknown[] = []) {
      const r = await client.execute({ sql, args: sanitizeParams(params) })
      return (r.rows[0] as T) ?? undefined
    },
    async all<T>(sql: string, params: unknown[] = []) {
      const r = await client.execute({ sql, args: sanitizeParams(params) })
      return r.rows as unknown as T[]
    },
    async exec(sql) {
      await client.execute(sql)
    },
    async getUserVersion() {
      await client.execute(
        'CREATE TABLE IF NOT EXISTS _migrations (key TEXT PRIMARY KEY, value INTEGER NOT NULL)'
      )
      const r = await client.execute({
        sql: 'SELECT value FROM _migrations WHERE key = ?',
        args: ['user_version']
      })
      return ((r.rows[0] as Record<string, unknown>)?.value as number) ?? 0
    },
    async setUserVersion(version) {
      if (!Number.isInteger(version)) throw new Error(`Invalid user_version: ${version}`)
      await client.execute({
        sql: 'INSERT OR REPLACE INTO _migrations (key, value) VALUES (?, ?)',
        args: ['user_version', version]
      })
    },
    async transaction(fn) {
      const tx = await client.transaction('write')
      try {
        await fn()
        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }
    },
    close() {
      client.close()
    }
  }
}

interface Migration {
  version: number
  up: (db: DbAdapter) => Promise<void>
}

async function runMigrations(db: DbAdapter, migrations: Migration[]): Promise<void> {
  const currentVersion = await db.getUserVersion()

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .toSorted((a, b) => a.version - b.version)

  for (const migration of pending) {
    await db.transaction(async () => {
      await migration.up(db)
      await db.setUserVersion(migration.version)
    })
  }
}

export { createLibsqlAdapter, createSqliteAdapter, runMigrations }
export type { DbAdapter, Migration }
