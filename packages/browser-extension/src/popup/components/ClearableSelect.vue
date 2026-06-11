<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

const model = defineModel<string | undefined>()

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement>()

function onTabKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') isOpen.value = false
}

// Reka UI's Select opens only on pointerdown and selects only on pointerup or
// a real keydown. Narrator (and other AT) activate elements with a simulated
// click that has neither, so translate those clicks ourselves. Real pointer
// interaction always fires pointerup right before click; AT clicks don't.
let lastPointerupAt = 0

function onPointerupCapture() {
  lastPointerupAt = Date.now()
}

function onClickCapture(e: MouseEvent) {
  if (Date.now() - lastPointerupAt < 500) return
  const target = e.target as HTMLElement | null
  const option = target?.closest<HTMLElement>('[role="option"]')
  if (option) {
    option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }))
    return
  }
  if (target?.closest('[role="combobox"]')) isOpen.value = !isOpen.value
}

function focusSelectedOrFirstOption() {
  if (!isOpen.value) return
  const listbox = wrapperRef.value?.querySelector<HTMLElement>('[role="listbox"]')
  if (!listbox || listbox.contains(document.activeElement)) return
  const option =
    listbox.querySelector<HTMLElement>(
      '[role="option"][data-state="checked"]:not([data-disabled])'
    ) ?? listbox.querySelector<HTMLElement>('[role="option"]:not([data-disabled])')
  option?.focus()
}

let focusRetryTimer: ReturnType<typeof setTimeout> | undefined

watch(isOpen, async (open, _, onCleanup) => {
  clearTimeout(focusRetryTimer)
  if (!open) return
  document.addEventListener('keydown', onTabKeydown)
  onCleanup(() => document.removeEventListener('keydown', onTabKeydown))
  await nextTick()
  focusSelectedOrFirstOption()
  // Reka re-focuses the trigger during an AT's simulated click; move focus to
  // an option again once the content has settled.
  focusRetryTimer = setTimeout(focusSelectedOrFirstOption, 100)
})

const props = withDefaults(
  defineProps<{
    id?: string
    label?: string
    ariaDescribedby?: string
    items: { label: string; value: string }[]
    valueKey?: keyof { label: string; value: string }
    placeholder?: string
    required?: boolean
    clearLabel?: string
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
  }>(),
  {
    valueKey: 'value',
    required: false,
    clearLabel: undefined,
    label: undefined,
    ariaDescribedby: undefined,
    variant: 'subtle'
  }
)

const { t } = useI18n()

const selectedLabel = computed(
  () => props.items.find((item) => (item[props.valueKey] ?? item.value) === model.value)?.label
)

const triggerAriaLabel = computed(() => {
  if (!props.label) return undefined
  if (selectedLabel.value) return `${props.label}: ${selectedLabel.value}`
  if (props.placeholder) return `${props.label}, ${props.placeholder}`
  return props.label
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative w-full"
    @pointerup.capture="onPointerupCapture"
    @click.capture="onClickCapture"
  >
    <USelect
      :id="id"
      v-model="model"
      :open="isOpen"
      @update:open="isOpen = $event"
      :items="items"
      :value-key="valueKey"
      :placeholder="placeholder"
      :ui="{
        placeholder: 'text-toned',
        trailingIcon: 'icon-animation text-toned',
        item: 'cursor-pointer selectable-focus',
        base: 'pe-14 py-2',
        content: 'z-50'
      }"
      :portal="false"
      :required="required"
      :aria-label="triggerAriaLabel"
      :aria-describedby="ariaDescribedby"
      :aria-required="required ? 'true' : undefined"
      :variant="variant"
    />
    <UButton
      v-if="model"
      variant="ghost"
      size="xs"
      icon="i-lucide-x"
      :aria-label="clearLabel || t('form.clear')"
      :ui="{
        base: 'absolute end-8 top-1/2 -translate-y-1/2'
      }"
      @pointerdown.stop
      @click.stop="model = undefined"
      @keydown.enter.space.prevent.stop="model = undefined"
    />
  </div>
</template>
