<script setup lang="ts">
const { t } = useI18n()
const head = useLocaleHead({ seo: true })

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
    <UHeader>
      <template #left>
        <NuxtLinkLocale to="/">
          <AppLogo />
        </NuxtLinkLocale>
      </template>

      <template #right>
        <LocaleSwitcher />
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <UContainer>
        <NuxtPage />
      </UContainer>
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">WCAGify &copy; {{ new Date().getFullYear() }}</p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/timdamen/wcagify"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
