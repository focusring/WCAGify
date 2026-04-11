export default defineEventHandler((event) => {
  const settingsCookie = getCookie(event, 'wcagify-settings')
  const localeCookie = getCookie(event, 'i18n_redirected')

  let accentColor = 'green'
  let neutralColor = 'slate'

  if (settingsCookie) {
    try {
      const parsed = JSON.parse(settingsCookie)
      if (parsed.accentColor) accentColor = parsed.accentColor
      if (parsed.neutralColor) neutralColor = parsed.neutralColor
    } catch {
      // ignore malformed cookie
    }
  }

  return {
    accentColor,
    neutralColor,
    locale: localeCookie || 'en'
  }
})
