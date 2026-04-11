import { describe, it, expect } from 'vitest'

/**
 * Tests for the settings parsing logic used by GET /api/settings.
 * Mirrors the validation in settings.get.ts as a pure function
 * since the actual handler relies on Nitro auto-imports.
 */
const ACCENT_COLORS = ['green', 'blue', 'red', 'orange', 'teal', 'indigo', 'violet']
const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone']
const LOCALES = ['en', 'nl']

function parseSettings(settingsCookie: string | undefined, localeCookie: string | undefined) {
  let accentColor = 'green'
  let neutralColor = 'slate'

  if (settingsCookie) {
    try {
      const parsed = JSON.parse(settingsCookie)
      if (typeof parsed.accentColor === 'string' && ACCENT_COLORS.includes(parsed.accentColor)) {
        accentColor = parsed.accentColor
      }
      if (typeof parsed.neutralColor === 'string' && NEUTRAL_COLORS.includes(parsed.neutralColor)) {
        neutralColor = parsed.neutralColor
      }
    } catch {
      // Ignore malformed cookie
    }
  }

  const locale =
    typeof localeCookie === 'string' && LOCALES.includes(localeCookie) ? localeCookie : 'en'

  return { accentColor, neutralColor, locale }
}

describe('GET /api/settings parsing', () => {
  it('returns defaults when no cookies are set', () => {
    const result = parseSettings(undefined, undefined)
    expect(result).toEqual({ accentColor: 'green', neutralColor: 'slate', locale: 'en' })
  })

  it('parses accent and neutral color from settings cookie', () => {
    const cookie = JSON.stringify({ accentColor: 'blue', neutralColor: 'zinc' })
    const result = parseSettings(cookie, undefined)
    expect(result.accentColor).toBe('blue')
    expect(result.neutralColor).toBe('zinc')
  })

  it('returns locale from i18n cookie', () => {
    const result = parseSettings(undefined, 'nl')
    expect(result.locale).toBe('nl')
  })

  it('parses all values together', () => {
    const cookie = JSON.stringify({ accentColor: 'indigo', neutralColor: 'stone' })
    const result = parseSettings(cookie, 'nl')
    expect(result).toEqual({ accentColor: 'indigo', neutralColor: 'stone', locale: 'nl' })
  })

  it('handles malformed JSON in settings cookie gracefully', () => {
    const result = parseSettings('not-valid-json{', 'en')
    expect(result).toEqual({ accentColor: 'green', neutralColor: 'slate', locale: 'en' })
  })

  it('uses defaults when settings cookie has no color fields', () => {
    const cookie = JSON.stringify({ somethingElse: true })
    const result = parseSettings(cookie, undefined)
    expect(result.accentColor).toBe('green')
    expect(result.neutralColor).toBe('slate')
  })

  it('handles partial settings cookie with only accentColor', () => {
    const cookie = JSON.stringify({ accentColor: 'red' })
    const result = parseSettings(cookie, undefined)
    expect(result.accentColor).toBe('red')
    expect(result.neutralColor).toBe('slate')
  })

  it('handles partial settings cookie with only neutralColor', () => {
    const cookie = JSON.stringify({ neutralColor: 'gray' })
    const result = parseSettings(cookie, undefined)
    expect(result.accentColor).toBe('green')
    expect(result.neutralColor).toBe('gray')
  })

  it('defaults locale to en when i18n cookie is empty string', () => {
    const result = parseSettings(undefined, '')
    expect(result.locale).toBe('en')
  })

  it('rejects invalid accent color and falls back to default', () => {
    const cookie = JSON.stringify({ accentColor: 'pink', neutralColor: 'slate' })
    const result = parseSettings(cookie, undefined)
    expect(result.accentColor).toBe('green')
  })

  it('rejects invalid neutral color and falls back to default', () => {
    const cookie = JSON.stringify({ accentColor: 'green', neutralColor: 'magenta' })
    const result = parseSettings(cookie, undefined)
    expect(result.neutralColor).toBe('slate')
  })

  it('rejects invalid locale and falls back to en', () => {
    const result = parseSettings(undefined, 'fr')
    expect(result.locale).toBe('en')
  })

  it('rejects non-string color values', () => {
    const cookie = JSON.stringify({ accentColor: 42, neutralColor: true })
    const result = parseSettings(cookie, undefined)
    expect(result.accentColor).toBe('green')
    expect(result.neutralColor).toBe('slate')
  })
})
