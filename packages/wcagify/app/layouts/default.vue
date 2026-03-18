<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <UHeader :toggle="false">
    <template #left>
      <NuxtLinkLocale to="/">
        <AppLogo />
      </NuxtLinkLocale>
    </template>

    <template #right>
      <UButton
        :to="localePath('/settings')"
        :label="t('settings.title').toLowerCase()"
        color="neutral"
        icon="i-lucide-settings"
        variant="ghost"
        class="no-underline!"
      />
    </template>
  </UHeader>

  <UMain>
    <UContainer>
      <slot />
    </UContainer>
  </UMain>

  <USeparator />

  <UFooter>
    <template #left>
      <p class="text-sm text-muted">WCAGify &copy; {{ new Date().getFullYear() }}</p>
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
