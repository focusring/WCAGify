/**
 * Replaces every occurrence of the URL prefix `from` with `to` in every string
 * of `value`, and returns a copy; `value` itself is left unchanged.
 *
 * Issue markdown points at `/api/uploads/<report>/<file>`, which requires an
 * admin session. Whoever serves a report elsewhere rewrites those URLs to a
 * route their reader can load: the share route to
 * `/api/share/<token>/uploads/`, a portal to its own image route. Pass the
 * report's own prefix as `from`, so another report's evidence is left alone.
 *
 * Walks the whole payload rather than a known field, because issue bodies are a
 * content AST whose shape is not ours to depend on.
 */
function rewriteUploadUrls<T>(value: T, from: string, to: string): T {
  const walk = (node: unknown): unknown => {
    if (typeof node === 'string') {
      return node.includes(from) ? node.replaceAll(from, to) : node
    }
    if (Array.isArray(node)) {
      return node.map((item) => walk(item))
    }
    if (node && typeof node === 'object') {
      const result: Record<string, unknown> = {}
      for (const [key, item] of Object.entries(node)) {
        result[key] = walk(item)
      }
      return result
    }
    return node
  }

  return walk(value) as T
}

export { rewriteUploadUrls }
