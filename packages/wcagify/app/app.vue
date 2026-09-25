<script setup lang="ts">
import { en as uiEn, nl as uiNl } from '@nuxt/ui/locale'

const { t, locale } = useI18n()
const uiLocale = computed(() => (locale.value === 'nl' ? uiNl : uiEn))
const head = useLocaleHead({ seo: true })
const { status: adminStatus, refresh: refreshAdminStatus } = useAdminAuth()

onMounted(async () => {
  if (!adminStatus.value) await refreshAdminStatus()
  if (adminStatus.value?.dev && !adminStatus.value.configured) {
    console.warn(
      '[wcagify] WCAGIFY_ADMIN_SECRET is not set. In production, the app will be locked until this is configured.'
    )
  }
})

// Getters keep `<html lang>` in step with an interface language switched without a reload.
// Report pages override `lang` with the report's own language.
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: () => [{ rel: 'icon', href: '/favicon.ico' }, ...(head.value.link || [])],
  htmlAttrs: {
    lang: () => head.value.htmlAttrs?.lang,
    dir: () => head.value.htmlAttrs?.dir
  }
})

useSeoMeta({
  title: () => t('app.title'),
  description: () => t('app.description'),
  ogTitle: () => t('app.title'),
  ogDescription: () => t('app.description')
})
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
