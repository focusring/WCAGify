<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const route = useRoute()
const isSettingsPage = computed(() => route.path === localePath('/settings'))
</script>

<template>
  <UHeader :toggle="false">
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

  <UFooter>
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
