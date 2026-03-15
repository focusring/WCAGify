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
  severity: string
  difficulty: string
  sample: string
}): string {
  return [
    '---',
    `title: ${escapeYamlValue(data.title)}`,
    `sc: ${escapeYamlValue(data.sc)}`,
    `severity: ${data.severity}`,
    `difficulty: ${data.difficulty}`,
    `sample: ${escapeYamlValue(data.sample)}`,
    '---'
  ].join('\n')
}
