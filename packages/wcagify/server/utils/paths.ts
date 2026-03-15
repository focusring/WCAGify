import { resolve, join } from 'node:path'

/**
 * Resolves a file path within a base directory and guards against path traversal.
 * Throws a 400 error if the resolved path escapes the base directory.
 */
export function resolveSecurePath(base: string[], filename: string) {
  const dir = resolve(process.cwd(), ...base)
  const filepath = join(dir, filename)
  if (!filepath.startsWith(dir + '/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }
  return { dir, filepath }
}
