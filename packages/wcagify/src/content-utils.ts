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

interface ReportFrontmatterData {
  title: string
  description?: string
  language: 'en' | 'nl'
  evaluation: {
    evaluator: string
    commissioner: string
    target: string
    targetLevel: string
    targetWcagVersion: string
    date: string
    specialRequirements: string
  }
  scope: string[]
  baseline: string[]
  technologies: string[]
  sample: { id: string; title: string; url: string; description: string }[]
  scStatuses?: Record<string, 'passed' | 'not-present'>
}

function indentedList(items: string[]): string[] {
  if (items.length === 0) return ['  []']
  return items.map((item) => `  - ${escapeYamlValue(item)}`)
}

function indentedMap(record: Record<string, string>): string[] {
  const keys = Object.keys(record)
  if (keys.length === 0) return ['  {}']
  return keys.map((key) => `  ${escapeYamlValue(key)}: ${escapeYamlValue(record[key]!)}`)
}

/**
 * Builds YAML frontmatter content for a report `index.md` file.
 */
function buildReportFrontmatter(data: ReportFrontmatterData): string {
  const lines: string[] = ['---', `title: ${escapeYamlValue(data.title)}`]
  if (data.description !== undefined) {
    lines.push(`description: ${escapeYamlValue(data.description)}`)
  }
  lines.push(`language: ${data.language}`, 'evaluation:')
  lines.push(`  evaluator: ${escapeYamlValue(data.evaluation.evaluator)}`)
  lines.push(`  commissioner: ${escapeYamlValue(data.evaluation.commissioner)}`)
  lines.push(`  target: ${escapeYamlValue(data.evaluation.target)}`)
  lines.push(`  targetLevel: ${data.evaluation.targetLevel}`)
  lines.push(`  targetWcagVersion: '${data.evaluation.targetWcagVersion}'`)
  lines.push(`  date: ${escapeYamlValue(data.evaluation.date)}`)
  lines.push(`  specialRequirements: ${escapeYamlValue(data.evaluation.specialRequirements)}`)
  lines.push('scope:', ...indentedList(data.scope))
  lines.push('baseline:', ...indentedList(data.baseline))
  lines.push('technologies:', ...indentedList(data.technologies))
  lines.push('sample:')
  if (data.sample.length === 0) {
    lines.push('  []')
  } else {
    for (const page of data.sample) {
      lines.push(`  - id: ${escapeYamlValue(page.id)}`)
      lines.push(`    title: ${escapeYamlValue(page.title)}`)
      lines.push(`    url: ${escapeYamlValue(page.url)}`)
      lines.push(`    description: ${escapeYamlValue(page.description)}`)
    }
  }
  if (data.scStatuses && Object.keys(data.scStatuses).length > 0) {
    lines.push('scStatuses:', ...indentedMap(data.scStatuses))
  }
  lines.push('---')
  return lines.join('\n')
}

export { toSlug, escapeYamlValue, buildIssueFrontmatter, buildReportFrontmatter }
