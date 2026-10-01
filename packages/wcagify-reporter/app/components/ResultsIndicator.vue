<script setup lang="ts">
type Status = 'passed' | 'failed' | 'not-present'

const props = defineProps<{
  status: Status
  count: number
  active: boolean
  filtering: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

/*
 * Explicit shades rather than the `--ui-*` tokens: the tiles use black text,
 * and the tokens are tuned for white text (light-mode `--ui-error` is red-700,
 * 3.27:1 against black). 500 in light and 400 in dark keep the tiles readable
 * for every configured palette.
 */
const config: Record<Status, { icon: string; class: string }> = {
  passed: { icon: 'i-lucide:check', class: 'bg-success-500 dark:bg-success-400' },
  failed: { icon: 'i-lucide:x', class: 'bg-error-500 dark:bg-error-400' },
  'not-present': {
    icon: 'i-lucide:book-dashed',
    class: 'bg-info-500 dark:bg-info-400'
  }
}
</script>

<template>
  <!--
    A "show only this status" toggle: pressed while the list is filtered to
    this status, not pressed while every status is shown. The name comes from
    the visible content in visual order ("15 Passed").
  -->
  <button
    type="button"
    :aria-pressed="filtering && active"
    class="flex flex-col items-center p-2.5 md:max-w-34 w-full rounded-lg border-2 border-current text-black font-semibold cursor-pointer transition-all"
    :class="[
      config[status].class,
      active && filtering
        ? 'outline-2 outline-dashed outline-offset-2 outline-black dark:outline-white'
        : ''
    ]"
    @click="emit('toggle')"
  >
    <span class="flex gap-0.5 items-center">
      <UIcon :name="config[status].icon" class="shrink-0 size-4.5" />
      <span class="text-lg">{{ count }}</span>
    </span>
    <span>
      {{ $t(`report.scStatus.${status}`) }}
    </span>
  </button>
</template>
