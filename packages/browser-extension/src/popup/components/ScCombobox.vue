<script setup lang="ts">
import { computed } from 'vue'
import type { WcagVersion, WcagLevel } from '../../data/wcag-criteria'
import { WCAG_CRITERIA } from '../../data/wcag-criteria'
import { useI18n } from '../../composables/useI18n'

const props = defineProps<{
  id: string
  wcagVersion: WcagVersion
  targetLevel: WcagLevel
  required?: boolean
  placeholder?: string
}>()

const model = defineModel<string>({ default: '' })

const { locale, t } = useI18n()

const levelInScope = computed(() => {
  const levels: WcagLevel[] = ['A']
  if (props.targetLevel === 'AA' || props.targetLevel === 'AAA') levels.push('AA')
  if (props.targetLevel === 'AAA') levels.push('AAA')
  return new Set(levels)
})

function getName(c: (typeof WCAG_CRITERIA)[number]) {
  return locale.value === 'nl' ? c.name.nl : c.name.en
}

const items = computed(() =>
  WCAG_CRITERIA.filter(
    (c) => c.versions.includes(props.wcagVersion) && levelInScope.value.has(c.level)
  ).map((c) => ({
    label: `${c.sc} ${getName(c)}`,
    value: c.sc,
    sc: c.sc,
    level: c.level as WcagLevel,
    name: getName(c)
  }))
)

const selectedItem = computed(() => items.value.find((item) => item.value === model.value) ?? null)
</script>

<template>
  <USelectMenu
    :id="id"
    v-model="model"
    :items="items"
    value-key="value"
    searchable
    :search-input="{
      placeholder: t('form.scSearch'),
      leadingIcon: 'i-lucide-search',
      ui: { base: 'ps-12' }
    }"
    :placeholder="placeholder"
    :ui="{
      base: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm text-left grid grid-cols-[minmax(2rem,auto)_auto_1fr_auto] py-1 h-8 pr-7.5',
      placeholder: 'text-muted',
      trailingIcon:
        'text-muted group-data-[state=open]:rotate-180 transition-transform duration-200',
      item: 'grid grid-cols-[minmax(2rem,auto)_auto_1fr_auto] cursor-pointer data-[highlighted]:ring-2 data-[highlighted]:ring-inset data-[highlighted]:ring-primary data-[highlighted]:rounded-sm'
    }"
    :required="required"
    variant="subtle"
    class="w-full cursor-pointer"
  >
    <template #default>
      <!-- Select bar -->
      <template v-if="selectedItem">
        <UBadge
          class="shrink-0 w-fit text-xs font-semibold py-0.5"
          :color="
            selectedItem.level === 'A' ? 'error' : selectedItem.level === 'AA' ? 'warning' : 'info'
          "
          variant="outline"
          size="sm"
          >{{ selectedItem.level }}</UBadge
        >
        <span class="font-medium shrink-0">{{ selectedItem.sc }}</span>
        <span class="min-w-0 truncate">{{ selectedItem.name }}</span>
      </template>
      <span v-else class="text-muted">{{ placeholder ?? '\xA0' }}</span>
      <UButton
        v-if="model"
        as="span"
        tabindex="0"
        color="primary"
        variant="ghost"
        size="xs"
        icon="i-lucide-x"
        :aria-label="t('form.clear')"
        :ui="{
          base: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
        }"
        class="cursor-pointer"
        @pointerdown.stop
        @click.stop="model = ''"
        @keydown.enter.stop="model = ''"
        @keydown.space.prevent.stop="model = ''"
      />
    </template>
    <!-- Select bar items -->
    <template #item="{ item }">
      <UBadge
        class="shrink-0 w-fit text-xs font-semibold py-0.5"
        :color="item.level === 'A' ? 'error' : item.level === 'AA' ? 'warning' : 'info'"
        variant="subtle"
        size="sm"
        >{{ item.level }}</UBadge
      >
      <span class="font-medium shrink-0">{{ item.sc }}</span>
      <span class="truncate">{{ item.name }}</span>
      <UIcon
        name="i-lucide-check"
        class="shrink-0 size-5 text-default"
        :class="{ invisible: item.value !== model }"
      />
    </template>
    <template #empty>
      {{ t('form.noResults') }}
    </template>
  </USelectMenu>
</template>
