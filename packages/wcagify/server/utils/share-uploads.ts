const UPLOADS_PREFIX = '/api/uploads/'

/**
 * Rewrites the evidence URLs in a shared report so the recipient can load them.
 *
 * Issue markdown points at `/api/uploads/<report>/<file>`, which requires an admin
 * session. A share recipient has no session, only a token, so those URLs are rewritten
 * to `/api/share/<token>/uploads/<file>` — a route the auth middleware treats as public
 * and which serves only the evidence belonging to that token's report.
 *
 * Walks the whole payload rather than a known field, because issue bodies are a content
 * AST whose shape is not ours to depend on.
 */
function rewriteUploadUrls<T>(value: T, reportSlug: string, token: string): T {
  const from = `${UPLOADS_PREFIX}${reportSlug}/`
  const to = `/api/share/${token}/uploads/`

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
