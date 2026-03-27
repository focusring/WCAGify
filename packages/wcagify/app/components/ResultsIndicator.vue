<script setup lang="ts">
const { t } = useI18n()

type Status = 'passed' | 'failed' | 'not-present' | 'not-tested'

const props = defineProps<{
  status: Status
  count: number
  active: boolean
  filtering: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const config: Record<Status, { icon: string; class: string }> = {
  passed: { icon: 'i-lucide:check', class: 'bg-success' },
  failed: { icon: 'i-lucide:x', class: 'bg-error' },
  'not-present': {
    icon: 'i-lucide:book-dashed',
    class: 'bg-secondary'
  },
  'not-tested': {
    icon: 'i-lucide:mouse-pointer-2-off',
    class: 'bg-warning'
  }
}
</script>

<template>
  <button
    role="switch"
    :aria-checked="active"
    :aria-label="t(`report.scStatus.${status}`) + ': ' + count"
    class="flex flex-col items-center p-2.5 md:max-w-34 w-full rounded-lg text-gray-950 font-semibold cursor-pointer transition-all"
    :class="[
      config[status].class,
      active && filtering
        ? 'outline-2 outline-dashed outline-offset-2 outline-gray-950 dark:outline-white'
        : ''
    ]"
    @click="emit('toggle')"
  >
    <span class="flex gap-0.5 items-center">
      <UIcon :name="config[status].icon" class="shrink-0 size-4.5" />
      <span class="text-lg">{{ count }}</span>
    </span>
    <span>
      {{ t(`report.scStatus.${status}`) }}
    </span>
  </button>
</template>
