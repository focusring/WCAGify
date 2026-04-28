import type { InValue } from '@libsql/client'

interface DbAdapter {
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>
  get<T>(sql: string, params?: unknown[]): Promise<T | undefined>
  all<T>(sql: string, params?: unknown[]): Promise<T[]>
  exec(sql: string): Promise<void>
  getUserVersion(): Promise<number>
  setUserVersion(version: number): Promise<void>
  transaction(fn: (tx: DbAdapter) => Promise<void>): Promise<void>
  close(): void
}

const sanitizeParams = (params: unknown[]) =>
  // eslint-disable-next-line unicorn/no-null -- libsql requires null, not undefined
  params.map((p) => (p === undefined ? null : p)) as InValue[]

interface Executable {
  execute(stmt: string | { sql: string; args: InValue[] }): Promise<{
    rowsAffected: number
    rows: unknown[]
  }>
}

function buildMethods(target: Executable) {
  return {
    async run(sql: string, params: unknown[] = []) {
      const r = await target.execute({ sql, args: sanitizeParams(params) })
      return { changes: r.rowsAffected }
    },
    async get<T>(sql: string, params: unknown[] = []) {
      const r = await target.execute({ sql, args: sanitizeParams(params) })
      return (r.rows[0] as T) ?? undefined
    },
    async all<T>(sql: string, params: unknown[] = []) {
      const r = await target.execute({ sql, args: sanitizeParams(params) })
      return r.rows as unknown as T[]
    },
    async exec(sql: string) {
      await target.execute(sql)
    },
    async getUserVersion() {
      await target.execute(
        'CREATE TABLE IF NOT EXISTS _migrations (key TEXT PRIMARY KEY, value INTEGER NOT NULL)'
      )
      const r = await target.execute({
        sql: 'SELECT value FROM _migrations WHERE key = ?',
        args: ['user_version']
      })
      return ((r.rows[0] as Record<string, unknown>)?.value as number) ?? 0
    },
    async setUserVersion(version: number) {
      if (!Number.isInteger(version)) throw new Error(`Invalid user_version: ${version}`)
      await target.execute({
        sql: 'INSERT OR REPLACE INTO _migrations (key, value) VALUES (?, ?)',
        args: ['user_version', version]
      })
    }
  }
}

async function createLibsqlAdapter(url: string, authToken?: string): Promise<DbAdapter> {
  const { createClient } = await import('@libsql/client')
  const client = createClient({ url, authToken })
  const methods = buildMethods(client)

  return {
    ...methods,
    async transaction(fn) {
      const tx = await client.transaction('write')
      const txAdapter: DbAdapter = {
        ...buildMethods(tx),
        transaction() {
          throw new Error('Nested transactions are not supported')
        },
        close() {}
      }
      try {
        await fn(txAdapter)
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

async function createLocalAdapter(dbPath: string): Promise<DbAdapter> {
  const { mkdirSync } = await import('node:fs')
  const { dirname } = await import('node:path')

  mkdirSync(dirname(dbPath), { recursive: true })

  return createLibsqlAdapter(`file:${dbPath}`)
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
    await db.transaction(async (tx) => {
      await migration.up(tx)
      await tx.setUserVersion(migration.version)
    })
  }
}

export { createLibsqlAdapter, createLocalAdapter, runMigrations }
export type { DbAdapter, Migration }
