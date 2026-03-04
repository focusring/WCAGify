<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const items = computed(() =>
  locales.value.map((loc) => ({
    label: loc.name || loc.code,
    type: 'link' as const,
    to: switchLocalePath(loc.code)
  }))
)

const currentLabel = computed(() => locale.value.toUpperCase())
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton :label="currentLabel" icon="i-lucide-languages" color="neutral" variant="ghost" />
  </UDropdownMenu>
</template>
