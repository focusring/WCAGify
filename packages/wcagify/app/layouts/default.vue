<script setup lang="ts">
// The header and footer are interface text, so they carry the interface language:
// on a report page the document language is the report's own.
const { t, locale } = useI18n()
const localePath = useLocalePath()

const route = useRoute()
const isSettingsPage = computed(() => route.path === localePath('/settings'))
</script>

<template>
  <UHeader :toggle="false" :lang="locale">
    <template #left>
      <NuxtLinkLocale class="h-9" to="/">
        <AppLogo />
      </NuxtLinkLocale>
    </template>

    <template #right>
      <UButton
        :to="localePath('/settings')"
        :label="t('settings.title').toLowerCase()"
        icon="i-lucide-settings"
        size="lg"
        color="neutral"
        :variant="isSettingsPage ? 'subtle' : 'ghost'"
      />
    </template>
  </UHeader>

  <UMain>
    <UContainer>
      <slot />
    </UContainer>
  </UMain>

  <USeparator aria-hidden="true" />

  <UFooter :lang="locale">
    <template #left>
      <p class="text-sm text-toned">WCAGify &copy; {{ new Date().getFullYear() }}</p>
    </template>

    <template #right>
      <UButton
        to="https://github.com/focusring/WCAGify"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
