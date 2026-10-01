// An app that renders reports with the report layer alone, as the focusring
// customer portal does. See docs/contributing/report-package.md.
export default defineNuxtConfig({
  extends: ['@focusring/wcagify-reporter/layer'],
  css: ['~/assets/css/main.css', '@focusring/wcagify-reporter/print.css'],
  i18n: { defaultLocale: 'en', strategy: 'no_prefix' },
  devtools: { enabled: false },
  compatibilityDate: '2026-10-01'
})
