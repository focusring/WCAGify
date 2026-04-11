import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock chrome.storage.local before importing useSettings
const storageData: Record<string, unknown> = {}
const chromeStub = {
  storage: {
    local: {
      get: vi.fn(async () => storageData),
      set: vi.fn(async () => {})
    }
  },
  runtime: {
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() }
  }
}
Object.defineProperty(globalThis, 'chrome', { value: chromeStub, writable: true })

// Must import after chrome mock is set up
const { useSettings, ACCENT_COLORS, NEUTRAL_COLORS } =
  await import('../src/composables/useSettings')
const { useI18n } = await import('../src/composables/useI18n')

describe('applyInstanceSettings', () => {
  beforeEach(() => {
    const settings = useSettings()
    settings.accentColor.value = 'green'
    settings.neutralColor.value = 'slate'
    const { locale } = useI18n()
    locale.value = 'en'
  })

  it('applies valid accent color', () => {
    const { applyInstanceSettings, accentColor } = useSettings()
    applyInstanceSettings({ accentColor: 'blue', neutralColor: 'slate', locale: 'en' })
    expect(accentColor.value).toBe('blue')
  })

  it('applies valid neutral color', () => {
    const { applyInstanceSettings, neutralColor } = useSettings()
    applyInstanceSettings({ accentColor: 'green', neutralColor: 'zinc', locale: 'en' })
    expect(neutralColor.value).toBe('zinc')
  })

  it('applies valid locale', () => {
    const { applyInstanceSettings } = useSettings()
    const { locale } = useI18n()
    applyInstanceSettings({ accentColor: 'green', neutralColor: 'slate', locale: 'nl' })
    expect(locale.value).toBe('nl')
  })

  it('applies all settings together', () => {
    const { applyInstanceSettings, accentColor, neutralColor } = useSettings()
    const { locale } = useI18n()
    applyInstanceSettings({ accentColor: 'indigo', neutralColor: 'stone', locale: 'nl' })
    expect(accentColor.value).toBe('indigo')
    expect(neutralColor.value).toBe('stone')
    expect(locale.value).toBe('nl')
  })

  it('ignores invalid accent color', () => {
    const { applyInstanceSettings, accentColor } = useSettings()
    applyInstanceSettings({ accentColor: 'pink', neutralColor: 'slate', locale: 'en' })
    expect(accentColor.value).toBe('green')
  })

  it('ignores invalid neutral color', () => {
    const { applyInstanceSettings, neutralColor } = useSettings()
    applyInstanceSettings({ accentColor: 'green', neutralColor: 'magenta', locale: 'en' })
    expect(neutralColor.value).toBe('slate')
  })

  it('ignores invalid locale', () => {
    const { applyInstanceSettings } = useSettings()
    const { locale } = useI18n()
    applyInstanceSettings({ accentColor: 'green', neutralColor: 'slate', locale: 'fr' })
    expect(locale.value).toBe('en')
  })

  it('does nothing when settings is undefined', () => {
    const { applyInstanceSettings, accentColor, neutralColor } = useSettings()
    const { locale } = useI18n()
    applyInstanceSettings(undefined)
    expect(accentColor.value).toBe('green')
    expect(neutralColor.value).toBe('slate')
    expect(locale.value).toBe('en')
  })

  it('handles empty strings gracefully', () => {
    const { applyInstanceSettings, accentColor, neutralColor } = useSettings()
    const { locale } = useI18n()
    applyInstanceSettings({ accentColor: '', neutralColor: '', locale: '' })
    expect(accentColor.value).toBe('green')
    expect(neutralColor.value).toBe('slate')
    expect(locale.value).toBe('en')
  })

  it('accepts every valid accent color', () => {
    const { applyInstanceSettings, accentColor } = useSettings()
    for (const color of ACCENT_COLORS) {
      applyInstanceSettings({ accentColor: color, neutralColor: 'slate', locale: 'en' })
      expect(accentColor.value).toBe(color)
    }
  })

  it('accepts every valid neutral color', () => {
    const { applyInstanceSettings, neutralColor } = useSettings()
    for (const color of NEUTRAL_COLORS) {
      applyInstanceSettings({ accentColor: 'green', neutralColor: color, locale: 'en' })
      expect(neutralColor.value).toBe(color)
    }
  })
})
