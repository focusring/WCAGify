import { describe, it, expect } from 'vitest'
import {
  toSlug,
  escapeYamlValue,
  buildIssueFrontmatter,
  buildIssueImageName
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

describe('buildIssueImageName', () => {
  it('joins the slug, the criterion digits and a hash with the upload extension', () => {
    expect(buildIssueImageName('focus-style-missing', '2.4.7', 'webp', '4fd52680')).toBe(
      'focus-style-missing-2-4-7-4fd52680.webp'
    )
  })

  it('defaults to webp and an 8 character hash', () => {
    expect(buildIssueImageName('no-keyboard', '2.1.1')).toMatch(
      /^no-keyboard-2-1-1-[0-9a-f]{8}\.webp$/
    )
  })

  it('keeps only the digits of the criterion', () => {
    expect(buildIssueImageName('tip', 'none', 'png', 'abcdef01')).toBe('tip--abcdef01.png')
    expect(buildIssueImageName('tip', 'SC 1.1.1', 'gif', 'abcdef01')).toBe('tip-1-1-1-abcdef01.gif')
  })

  it('produces names the upload route accepts', () => {
    expect(buildIssueImageName('a-b', '4.1.2', 'png')).toMatch(/^[a-z0-9-]+\.\w+$/)
  })
})
