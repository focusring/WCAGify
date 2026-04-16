<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const isOpen = ref(false)

function onTabKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') isOpen.value = false
}

watch(isOpen, (open, _, onCleanup) => {
  if (open) {
    document.addEventListener('keydown', onTabKeydown)
    onCleanup(() => document.removeEventListener('keydown', onTabKeydown))
  } else {
    document.removeEventListener('keydown', onTabKeydown)
  }
})
</script>

<template>
  <USelectMenu
    :id="id"
    v-model="model"
    :open="isOpen"
    @update:open="isOpen = $event"
    :items="items"
    value-key="value"
    searchable
    :search-input="{
      placeholder: t('form.scSearch'),
      leadingIcon: 'i-lucide-search',
      ui: { base: 'ps-13 mx-1.5 py-2 [&::placeholder]:text-muted selectable-focus' }
    }"
    :placeholder="placeholder"
    :aria-label="
      selectedItem
        ? `${t('form.scLabel')}: ${selectedItem.level} ${selectedItem.sc}, ${selectedItem.name}`
        : placeholder
          ? `${t('form.scLabel')}, ${placeholder}`
          : t('form.scLabel')
    "
    :ui="{
      base: 'text-left grid grid-cols-[minmax(2rem,auto)_auto_1fr_auto] py-1.5 h-9 pr-7.5 selectable-focus',
      placeholder: 'text-muted',
      trailingIcon: 'text-muted icon-animation',
      item: 'grid grid-cols-[minmax(2.5rem,auto)_auto_1fr_auto] items-center cursor-pointer selectable-focus',
      content: 'py-1 z-50',
      viewport: 'mt-2',
      group: 'space-y-1.5'
    }"
    :portal="false"
    :required="required"
    variant="subtle"
    class="w-full cursor-pointer"
  >
    <template #default>
      <!-- Select bar -->
      <template v-if="selectedItem">
        <UBadge
          class="shrink-0 w-fit text-sm text-highlighted font-semibold py-0.5 px-1.5"
          :color="
            selectedItem.level === 'A' ? 'info' : selectedItem.level === 'AA' ? 'warning' : 'info'
          "
          >{{ selectedItem.level }}</UBadge
        >
        <span class="font-medium shrink-0">{{ selectedItem.sc }}</span>
        <span class="min-w-0 truncate">{{ selectedItem.name }}</span>
      </template>
      <span v-else class="text-muted">{{ placeholder ?? '\xA0' }}</span>
      <UButton
        v-if="model"
        as="span"
        role="button"
        tabindex="0"
        color="primary"
        variant="ghost"
        size="xs"
        icon="i-lucide-x"
        :aria-label="t('form.clearSc')"
        :ui="{
          base: 'selectable-focus cursor-pointer'
        }"
        @pointerdown.stop
        @click.stop="model = ''"
        @keydown.enter.stop="model = ''"
        @keydown.space.prevent.stop="model = ''"
      />
    </template>
    <!-- Select bar items -->
    <template #item="{ item }">
      <UBadge
        class="shrink-0 w-fit text-sm text-highlighted font-semibold py-0.5 px-1.5"
        :color="item.level === 'A' ? 'info' : item.level === 'AA' ? 'warning' : 'info'"
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
