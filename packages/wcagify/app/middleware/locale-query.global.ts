/*
 * `?lang=nl` forces the interface language for one request. An embedding
 * site with its own language switch cannot rely on the locale cookie, since
 * browsers drop third-party cookies inside an iframe.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { lang } = to.query
  if (typeof lang !== 'string') return
  const { $i18n } = useNuxtApp()
  const requested = $i18n.locales.value.find((entry) => entry.code === lang)
  if (!requested || $i18n.locale.value === requested.code) return
  await $i18n.setLocale(requested.code)
})
