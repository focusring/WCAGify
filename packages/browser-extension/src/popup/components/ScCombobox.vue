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
    :clear="{ size: 'xs' }"
    clear-icon="i-lucide-circle-x"
    :ui="{
      placeholder: 'text-muted',
      trailingIcon: 'text-muted',
      item: 'grid grid-cols-[minmax(2rem,auto)_auto_1fr_auto] cursor-pointer'
    }"
    :required="required"
    variant="subtle"
    class="w-full cursor-pointer"
  >
    <template #default>
      <!-- Select bar -->
      <template v-if="selectedItem">
        <UBadge
          class="shrink-0 text-xs font-semibold py-0.5"
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
        class="shrink-0 size-4 text-default"
        :class="{ invisible: item.value !== model }"
      />
    </template>
    <template #empty>
      {{ t('form.noResults') }}
    </template>
  </USelectMenu>
</template>
