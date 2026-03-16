<script setup lang="ts">
const { t } = useI18n()

type Status = 'passed' | 'failed' | 'not-present' | 'not-tested'

const props = defineProps<{
  status: Status
  count: number
}>()

const config: Record<Status, { icon: string; class: string }> = {
  passed: { icon: 'i-lucide:check', class: 'bg-primary' },
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
  <div
    class="flex flex-col items-center p-2.5 md:max-w-34 w-full rounded-lg text-gray-950 font-semibold"
    :class="config[status].class"
  >
    <span class="flex gap-0.5 items-center">
      <UIcon :name="config[status].icon" class="shrink-0 size-4.5" />
      <p class="text-lg">{{ count }}</p>
    </span>
    <p>
      {{ t(`report.scStatus.${status}`) }}
    </p>
  </div>
</template>
