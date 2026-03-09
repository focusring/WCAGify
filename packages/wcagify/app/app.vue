<script setup lang="ts">
const { t } = useI18n()
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

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }, ...(head.value.link || [])],
  htmlAttrs: {
    ...head.value.htmlAttrs
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
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

