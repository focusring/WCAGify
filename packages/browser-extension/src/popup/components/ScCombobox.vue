<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
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

const listboxId = computed(() => `${props.id}-listbox`)

const query = ref('')
const isOpen = ref(false)
const activeIndex = ref(-1)

const listboxRef = ref<HTMLUListElement | undefined>()

// Levels that are in scope: A is always in scope, AA includes A, AAA includes all
const levelInScope = computed(() => {
  const levels: WcagLevel[] = ['A']
  if (props.targetLevel === 'AA' || props.targetLevel === 'AAA') levels.push('AA')
  if (props.targetLevel === 'AAA') levels.push('AAA')
  return new Set(levels)
})

const availableCriteria = computed(() =>
  WCAG_CRITERIA.filter(
    (c) => c.versions.includes(props.wcagVersion) && levelInScope.value.has(c.level)
  )
)

const filteredCriteria = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return availableCriteria.value
  return availableCriteria.value.filter((c) => {
    const name = locale.value === 'nl' ? c.name.nl : c.name.en
    return c.sc.startsWith(q) || name.toLowerCase().includes(q)
  })
})

const activeDescendantId = computed(() =>
  activeIndex.value >= 0 ? `${listboxId.value}-option-${activeIndex.value}` : undefined
)

function getName(c: (typeof WCAG_CRITERIA)[number]) {
  return locale.value === 'nl' ? c.name.nl : c.name.en
}

function open() {
  isOpen.value = true
  activeIndex.value = -1
}

function close() {
  isOpen.value = false
  activeIndex.value = -1
}

function select(index: number) {
  const item = filteredCriteria.value[index]
  if (!item) return
  model.value = item.sc
  query.value = `${item.sc} ${getName(item)}`
  close()
}

function scrollActiveIntoView() {
  nextTick(() => {
    if (activeIndex.value < 0 || !listboxRef.value) return
    const el = listboxRef.value.querySelector(`#${listboxId.value}-option-${activeIndex.value}`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function onInput() {
  model.value = ''
  if (!isOpen.value) open()
  activeIndex.value = -1
}

function onKeydown(e: KeyboardEvent) {
  const count = filteredCriteria.value.length

  switch (e.key) {
    case 'ArrowDown': {
      e.preventDefault()
      if (!isOpen.value) {
        open()
      }
      activeIndex.value = activeIndex.value < count - 1 ? activeIndex.value + 1 : 0
      scrollActiveIntoView()
      break
    }

    case 'ArrowUp': {
      e.preventDefault()
      if (!isOpen.value) {
        open()
      }
      activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : count - 1
      scrollActiveIntoView()
      break
    }

    case 'Home': {
      if (isOpen.value) {
        e.preventDefault()
        activeIndex.value = 0
        scrollActiveIntoView()
      }
      break
    }

    case 'End': {
      if (isOpen.value) {
        e.preventDefault()
        activeIndex.value = count - 1
        scrollActiveIntoView()
      }
      break
    }

    case 'Enter': {
      e.preventDefault()
      if (isOpen.value && activeIndex.value >= 0) {
        select(activeIndex.value)
      }
      break
    }

    case 'Escape': {
      if (isOpen.value) {
        e.preventDefault()
        close()
      }
      break
    }

    case 'Tab': {
      if (isOpen.value && activeIndex.value >= 0) {
        select(activeIndex.value)
      }
      close()
      break
    }
  }
}

function onFocus() {
  if (!isOpen.value && !model.value) {
    open()
  }
}

function onBlur(e: FocusEvent) {
  // Don't close if clicking within the listbox
  const related = e.relatedTarget as HTMLElement | null
  if (related && listboxRef.value?.contains(related)) return
  close()
}

function onOptionClick(index: number) {
  select(index)
}

function onOptionPointerEnter(index: number) {
  activeIndex.value = index
}

// Sync display text when model changes externally
watch(
  () => model.value,
  (val) => {
    if (val) {
      const match = availableCriteria.value.find((c) => c.sc === val)
      if (match) query.value = `${match.sc} ${getName(match)}`
    } else {
      query.value = ''
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      v-model="query"
      type="text"
      role="combobox"
      autocomplete="off"
      :aria-expanded="isOpen"
      aria-autocomplete="list"
      :aria-controls="listboxId"
      :aria-activedescendant="activeDescendantId"
      :aria-required="required || undefined"
      :required="required"
      :placeholder="placeholder"
      class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    />
    <ul
      v-show="isOpen"
      :id="listboxId"
      ref="listboxRef"
      role="listbox"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg"
    >
      <li
        v-for="(criterion, index) in filteredCriteria"
        :id="`${listboxId}-option-${index}`"
        :key="criterion.sc"
        role="option"
        :aria-selected="index === activeIndex"
        class="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm"
        :class="
          index === activeIndex
            ? 'bg-green-100 dark:bg-green-900/40 text-gray-900 dark:text-gray-100'
            : 'text-gray-700 dark:text-gray-300'
        "
        @click="onOptionClick(index)"
        @pointerenter="onOptionPointerEnter(index)"
      >
        <span class="font-mono font-medium shrink-0">{{ criterion.sc }}</span>
        <span class="truncate">{{ getName(criterion) }}</span>
        <span
          class="ml-auto shrink-0 rounded px-1 py-0.5 text-xs font-medium"
          :class="{
            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': criterion.level === 'A',
            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400':
              criterion.level === 'AA',
            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':
              criterion.level === 'AAA'
          }"
          >{{ criterion.level }}</span
        >
      </li>
      <li
        v-if="filteredCriteria.length === 0"
        class="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ t('form.noResults') }}
      </li>
    </ul>
  </div>
</template>
