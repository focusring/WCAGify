/**
 * Converts a title string into a URL-friendly slug.
 */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/**
 * Escapes a string value for safe use in YAML frontmatter.
 * Wraps the value in single quotes if it contains special YAML characters.
 */
function escapeYamlValue(value: string): string {
  if (/[:#{}[\],&*?|>!%@`"'\n]/.test(value) || value.startsWith(' ') || value.endsWith(' ')) {
    return `'${value.replace(/'/g, "''")}'`
  }
  return value
}

/**
 * Builds YAML frontmatter content for an issue markdown file.
 */
function buildIssueFrontmatter(data: {
  title: string
  sc: string
  severity?: string
  type?: string
  difficulty?: string
  sample: string
}): string {
  const lines = ['---', `title: ${escapeYamlValue(data.title)}`, `sc: ${escapeYamlValue(data.sc)}`]
  if (data.severity !== undefined) {
    lines.push(`severity: ${data.severity}`)
  }
  if (data.type !== undefined) {
    lines.push(`type: ${data.type}`)
  }
  if (data.difficulty !== undefined) {
    lines.push(`difficulty: ${data.difficulty}`)
  }
  lines.push(`sample: ${escapeYamlValue(data.sample)}`, '---')
  return lines.join('\n')
}

/**
 * Names an issue image the way the upload flow does: `<issue-slug>-<sc digits>-<8 hex>.<ext>`.
 * The serving route only accepts `[a-z0-9-]+.\w+`, so the slug and the criterion digits are the
 * only variable parts and the hash keeps two screenshots of one issue apart.
 */
function buildIssueImageName(
  titleSlug: string,
  sc: string,
  extension = 'webp',
  hash = globalThis.crypto.randomUUID().slice(0, 8)
): string {
  const scSlug = sc.replace(/[^0-9.]+/g, '').replace(/\./g, '-')
  return `${titleSlug}-${scSlug}-${hash}.${extension}`
}

export { toSlug, escapeYamlValue, buildIssueFrontmatter, buildIssueImageName }
