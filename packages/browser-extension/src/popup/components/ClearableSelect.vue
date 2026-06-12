<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

const model = defineModel<string | undefined>()

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement>()

function onTabKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') isOpen.value = false
}

// Reka UI's Select reacts to pointerup/keydown, not click. AT activation (e.g. Narrator Invoke) sends a simulated click with neither.
// Translate those clicks here; real pointers fire pointerup just before click.
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
  const popup = wrapperRef.value?.querySelector<HTMLElement>('[data-reka-popper-content-wrapper]')
  if (!popup || popup.contains(document.activeElement)) return
  const option =
    popup.querySelector<HTMLElement>(
      '[role="option"][data-state="checked"]:not([data-disabled])'
    ) ?? popup.querySelector<HTMLElement>('[role="option"]:not([data-disabled])')
  option?.focus()
}

let focusRetryTimer: ReturnType<typeof setTimeout> | undefined = undefined

watch(isOpen, async (open, _, onCleanup) => {
  clearTimeout(focusRetryTimer)
  if (!open) return
  document.addEventListener('keydown', onTabKeydown)
  onCleanup(() => document.removeEventListener('keydown', onTabKeydown))
  await nextTick()
  patchPopupForNarrator()
  focusSelectedOrFirstOption()
  // Reka re-focuses the trigger during an AT's simulated click.
  // Move focus back to an option once the content has settled.
  focusRetryTimer = setTimeout(() => {
    patchPopupForNarrator()
    focusSelectedOrFirstOption()
  }, 100)
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

// Narrator scan mode walks the raw a11y tree, stopping on every node. Making the content element the modal dialog drops the listbox's phantom "list"/"selection"
// stops (Blink confines scanning to a modal, skips its root). Options then need explicit posinset/setsize; their aria-hidden children make each a single stop;
// Reka's body-edge focus guards are hidden too (empty stops).
function patchPopupForNarrator() {
  const popup = wrapperRef.value?.querySelector<HTMLElement>('[data-reka-popper-content-wrapper]')
  if (!popup) return
  const content = popup.querySelector<HTMLElement>('[data-slot="content"]')
  if (content) {
    content.setAttribute('role', 'dialog')
    content.setAttribute('aria-modal', 'true')
    const popupLabel = props.label ?? props.placeholder
    if (popupLabel) content.setAttribute('aria-label', popupLabel)
  }
  const options = popup.querySelectorAll('[role="option"]')
  options.forEach((option, index) => {
    option.setAttribute('aria-posinset', String(index + 1))
    option.setAttribute('aria-setsize', String(options.length))
    // Options keep their accessible name: aria-labelledby includes hidden nodes.
    for (const child of option.children) child.setAttribute('aria-hidden', 'true')
  })
  for (const guard of document.querySelectorAll('[data-reka-focus-guard]')) {
    guard.setAttribute('aria-hidden', 'true')
  }
}

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
