<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { WcagVersion, WcagLevel } from '../../data/wcag-criteria'
import { WCAG_CRITERIA } from '../../data/wcag-criteria'
import { useI18n } from '../../composables/useI18n'

const props = defineProps<{
  id: string
  wcagVersion: WcagVersion
  targetLevel: WcagLevel
  required?: boolean
  placeholder?: string
  ariaDescribedby?: string
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

const selectedItem = computed(() => items.value.find((item) => item.value === model.value))

function levelLabel(level: WcagLevel) {
  return `${t('form.sc.level')} ${level}`
}

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement>()

function onTabKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') isOpen.value = false
}

watch(isOpen, async (open, _, onCleanup) => {
  if (open) {
    document.addEventListener('keydown', onTabKeydown)
    onCleanup(() => document.removeEventListener('keydown', onTabKeydown))
    await nextTick()
    const focusScope = wrapperRef.value?.querySelector<HTMLElement>('[data-slot="focusScope"]')
    if (focusScope) {
      focusScope.setAttribute('role', 'dialog')
      focusScope.setAttribute('aria-modal', 'true')
    }
  } else {
    document.removeEventListener('keydown', onTabKeydown)
    await nextTick()
    const focusScope = wrapperRef.value?.querySelector<HTMLElement>('[data-slot="focusScope"]')
    if (focusScope) {
      focusScope.removeAttribute('role')
      focusScope.removeAttribute('aria-modal')
    }
  }
})
</script>

<template>
  <div ref="wrapperRef" class="relative w-full">
    <USelectMenu
      :id="id"
      v-model="model"
      :open="isOpen"
      @update:open="isOpen = $event"
      :items="items"
      value-key="value"
      searchable
      :search-input="{
        placeholder: t('form.sc.search'),
        leadingIcon: 'i-lucide-search',
        ui: { base: 'ps-13 mx-1.5 py-2 selectable-focus' }
      }"
      :placeholder="placeholder"
      :aria-label="
        selectedItem
          ? `${t('form.sc.ariaLabel')}: ${levelLabel(selectedItem.level)} ${selectedItem.sc}, ${selectedItem.name}`
          : placeholder
            ? `${t('form.sc.ariaLabel')}, ${placeholder}`
            : t('form.sc.ariaLabel')
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
      :aria-describedby="ariaDescribedby"
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
      </template>
      <!-- Select bar items -->
      <template #item="{ item }">
        <span class="sr-only">{{ levelLabel(item.level) }} {{ item.sc }}, {{ item.name }}</span>
        <UBadge
          aria-hidden="true"
          class="shrink-0 w-fit text-sm text-highlighted font-semibold py-0.5 px-1.5"
          :color="item.level === 'A' ? 'info' : item.level === 'AA' ? 'warning' : 'info'"
          >{{ item.level }}</UBadge
        >
        <span aria-hidden="true" class="font-medium shrink-0">{{ item.sc }}</span>
        <span aria-hidden="true" class="truncate">{{ item.name }}</span>
        <UIcon
          name="i-lucide-check"
          class="shrink-0 size-5 text-default"
          :class="{ invisible: item.value !== model }"
        />
      </template>
      <template #empty>
        {{ t('form.sc.noResults') }}
      </template>
    </USelectMenu>
    <UButton
      v-if="model"
      as="span"
      role="button"
      tabindex="0"
      color="primary"
      variant="ghost"
      size="xs"
      icon="i-lucide-x"
      :aria-label="t('form.sc.clear')"
      :ui="{ base: 'selectable-focus cursor-pointer absolute end-8 top-1/2 -translate-y-1/2' }"
      @pointerdown.stop
      @click.stop="model = ''"
      @keydown.enter.stop="model = ''"
      @keydown.space.prevent.stop="model = ''"
    />
  </div>
</template>
