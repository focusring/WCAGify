import { resolve, join, sep } from 'node:path'

function isSafeSegment(segment: string): boolean {
  return segment !== '' && segment !== '.' && segment !== '..' && !/[\\/]/.test(segment)
}

/**
 * Resolves a file path within a base directory and guards against path traversal.
 * Throws a 400 error if the resolved path escapes the base directory whether via `filename`, or via a traversal segment smuggled into `base` itself.
 */
export function resolveSecurePath(base: string[], filename: string) {
  if (!base.every(isSafeSegment)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }
  const dir = resolve(process.cwd(), ...base)
  const filepath = join(dir, filename)
  if (!filepath.startsWith(dir + sep)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }
  return { dir, filepath }
}
