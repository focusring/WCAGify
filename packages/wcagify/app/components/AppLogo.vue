<template>
  <UIcon name="i-logo:wcagify" class="shrink-0 w-28 h-9 text-black dark:text-white" />
  <!-- The visible wordmark comes first in the name so "click WCAGify" reaches the link. -->
  <span class="visually-hidden">{{ $t('app.homeLink') }}</span>
</template>

<style scoped>
.visually-hidden:not(:focus):not(:active) {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
</style>
