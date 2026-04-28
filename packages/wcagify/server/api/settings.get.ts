const ACCENT_COLORS = ['green', 'blue', 'red', 'orange', 'teal', 'indigo', 'violet']
const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone']
const LOCALES = ['en', 'nl']

export default defineEventHandler((event) => {
  const settingsCookie = getCookie(event, 'wcagify-settings')
  const localeCookie = getCookie(event, 'i18n_redirected')

  let accentColor = 'green'
  let neutralColor = 'slate'

  if (settingsCookie) {
    try {
      const parsed = JSON.parse(settingsCookie)
      if (typeof parsed.accentColor === 'string' && ACCENT_COLORS.includes(parsed.accentColor)) {
        ;({ accentColor } = parsed)
      }
      if (typeof parsed.neutralColor === 'string' && NEUTRAL_COLORS.includes(parsed.neutralColor)) {
        ;({ neutralColor } = parsed)
      }
    } catch {
      // Ignore malformed cookie
    }
  }

  const locale =
    typeof localeCookie === 'string' && LOCALES.includes(localeCookie) ? localeCookie : 'en'

  return { accentColor, neutralColor, locale }
})
