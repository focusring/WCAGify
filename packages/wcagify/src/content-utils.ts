/**
 * Converts a title string into a URL-friendly slug.
 */
export function toSlug(title: string): string {
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
export function escapeYamlValue(value: string): string {
  if (/[:#{}[\],&*?|>!%@`"'\n]/.test(value) || value.startsWith(' ') || value.endsWith(' ')) {
    return `'${value.replace(/'/g, "''")}'`
  }
  return value
}

/**
 * Builds YAML frontmatter content for an issue markdown file.
 */
export function buildIssueFrontmatter(data: {
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
