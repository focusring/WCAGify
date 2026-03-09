<template>
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
  </UFooter>
</template>
