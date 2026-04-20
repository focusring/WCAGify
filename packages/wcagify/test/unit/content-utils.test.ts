import { describe, it, expect } from 'vitest'
import {
  toSlug,
  escapeYamlValue,
  buildIssueFrontmatter,
  buildReportFrontmatter
} from '../../src/content-utils'

describe('toSlug', () => {
  it('converts a simple title to lowercase kebab-case', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })

  it('strips leading and trailing hyphens', () => {
    expect(toSlug('--hello--')).toBe('hello')
  })

  it('collapses consecutive special characters into a single hyphen', () => {
    expect(toSlug('foo   bar___baz')).toBe('foo-bar-baz')
  })

  it('removes non-alphanumeric characters', () => {
    expect(toSlug('Héllo Wörld!')).toBe('h-llo-w-rld')
  })

  it('truncates to 80 characters', () => {
    const long = 'a'.repeat(100)
    expect(toSlug(long)).toHaveLength(80)
  })

  it('returns empty string for non-alphanumeric input', () => {
    expect(toSlug('!!!')).toBe('')
  })

  it('handles empty string', () => {
    expect(toSlug('')).toBe('')
  })

  it('handles numeric titles', () => {
    expect(toSlug('123 456')).toBe('123-456')
  })
})

describe('escapeYamlValue', () => {
  it('returns plain string when no special characters', () => {
    expect(escapeYamlValue('hello')).toBe('hello')
  })

  it('wraps in single quotes when value contains colon', () => {
    expect(escapeYamlValue('key: value')).toBe("'key: value'")
  })

  it('wraps in single quotes when value contains hash', () => {
    expect(escapeYamlValue('color #red')).toBe("'color #red'")
  })

  it('escapes single quotes by doubling them', () => {
    expect(escapeYamlValue("it's")).toBe("'it''s'")
  })

  it('wraps when value starts with space', () => {
    expect(escapeYamlValue(' leading')).toBe("' leading'")
  })

  it('wraps when value ends with space', () => {
    expect(escapeYamlValue('trailing ')).toBe("'trailing '")
  })

  it('wraps when value contains newline', () => {
    expect(escapeYamlValue('line1\nline2')).toBe("'line1\nline2'")
  })

  it('wraps when value contains curly braces', () => {
    expect(escapeYamlValue('{foo}')).toBe("'{foo}'")
  })

  it('wraps when value contains square brackets', () => {
    expect(escapeYamlValue('[foo]')).toBe("'[foo]'")
  })

  it('handles multiple special characters', () => {
    expect(escapeYamlValue("it's a #test: yes")).toBe("'it''s a #test: yes'")
  })
})

describe('buildIssueFrontmatter', () => {
  const base = {
    title: 'Missing alt text',
    sc: '1.1.1',
    severity: 'High',
    difficulty: 'Low',
    sample: 'home'
  }

  it('produces valid YAML frontmatter block', () => {
    const result = buildIssueFrontmatter(base)
    expect(result).toMatch(/^---\n/)
    expect(result).toMatch(/\n---$/)
  })

  it('includes all fields', () => {
    const result = buildIssueFrontmatter(base)
    expect(result).toContain('title: Missing alt text')
    expect(result).toContain('sc: 1.1.1')
    expect(result).toContain('severity: High')
    expect(result).toContain('difficulty: Low')
    expect(result).toContain('sample: home')
  })

  it('escapes title with special characters', () => {
    const result = buildIssueFrontmatter({ ...base, title: 'Link: "click here"' })
    expect(result).toContain('title: \'Link: "click here"\'')
  })

  it('escapes sc with special characters', () => {
    const result = buildIssueFrontmatter({ ...base, sc: 'sc: custom' })
    expect(result).toContain("sc: 'sc: custom'")
  })

  it('escapes sample with special characters', () => {
    const result = buildIssueFrontmatter({ ...base, sample: 'page #1' })
    expect(result).toContain("sample: 'page #1'")
  })
})

describe('buildReportFrontmatter', () => {
  const base = {
    title: 'Example audit',
    language: 'en' as const,
    evaluation: {
      evaluator: 'WCAGify',
      commissioner: 'Acme',
      target: 'example.com',
      targetLevel: 'AA',
      targetWcagVersion: '2.2',
      date: '2026-04-20',
      specialRequirements: 'None'
    },
    scope: ['https://example.com', 'https://example.com/contact'],
    baseline: ['Windows 11 + NVDA'],
    technologies: ['HTML', 'CSS'],
    sample: [{ id: 'page-1', title: 'Homepage', url: 'https://example.com', description: 'Home' }]
  }

  it('produces valid YAML delimiters and title', () => {
    const yaml = buildReportFrontmatter(base)
    expect(yaml.startsWith('---\n')).toBe(true)
    expect(yaml.endsWith('\n---')).toBe(true)
    expect(yaml).toContain('title: Example audit')
  })

  it('emits evaluation block with all required fields', () => {
    const yaml = buildReportFrontmatter(base)
    expect(yaml).toContain('evaluation:')
    expect(yaml).toContain('evaluator: WCAGify')
    expect(yaml).toContain('targetLevel: AA')
    expect(yaml).toContain("targetWcagVersion: '2.2'")
  })

  it('always quotes targetWcagVersion so YAML cannot parse it as a float', () => {
    const yaml = buildReportFrontmatter(base)
    expect(yaml).not.toContain('targetWcagVersion: 2.2')
    expect(yaml).toMatch(/targetWcagVersion: '2\.2'/)
  })

  it('emits scope list as indented YAML items', () => {
    const yaml = buildReportFrontmatter(base)
    expect(yaml).toContain('scope:')
    expect(yaml).toContain("- 'https://example.com'")
  })

  it('emits sample entries as nested maps', () => {
    const yaml = buildReportFrontmatter(base)
    expect(yaml).toContain('- id: page-1')
    expect(yaml).toContain('title: Homepage')
    expect(yaml).toContain("url: 'https://example.com'")
  })

  it('omits scStatuses when empty', () => {
    const yaml = buildReportFrontmatter(base)
    expect(yaml).not.toContain('scStatuses:')
  })

  it('emits scStatuses when provided', () => {
    const yaml = buildReportFrontmatter({
      ...base,
      scStatuses: { '1.2.1': 'passed', '1.2.2': 'not-present' }
    })
    expect(yaml).toContain('scStatuses:')
    expect(yaml).toContain('1.2.1: passed')
    expect(yaml).toContain('1.2.2: not-present')
  })

  it('produces empty-list placeholder for empty arrays', () => {
    const yaml = buildReportFrontmatter({ ...base, scope: [], technologies: [] })
    expect(yaml).toContain('scope:\n  []')
    expect(yaml).toContain('technologies:\n  []')
  })
})
