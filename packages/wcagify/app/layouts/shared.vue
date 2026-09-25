<script setup lang="ts">
// The footer is interface text; on a shared report the document language is the report's own.
const { locale } = useI18n()
</script>

<template>
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
  </UFooter>
</template>
