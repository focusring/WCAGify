<template>
  <UMain>
    <UContainer>
      <slot />
    </UContainer>
  </UMain>

  <USeparator decorative />

  <UFooter>
    <template #left>
      <p class="text-sm text-toned">WCAGify &copy; {{ new Date().getFullYear() }}</p>
    </template>
  </UFooter>
</template>
