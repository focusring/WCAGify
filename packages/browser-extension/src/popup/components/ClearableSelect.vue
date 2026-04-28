<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

const model = defineModel<string | undefined>()

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
  }>(),
  {
    valueKey: 'value',
    required: false,
    clearLabel: undefined,
    label: undefined,
    ariaDescribedby: undefined
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
  <div ref="wrapperRef" class="relative w-full">
    <USelectMenu
      :id="id"
      v-model="model"
      :open="isOpen"
      @update:open="isOpen = $event"
      :items="items"
      :value-key="valueKey"
      :search-input="false"
      :placeholder="placeholder"
      :ui="{
        placeholder: 'text-muted',
        item: 'cursor-pointer selectable-focus',
        base: 'pe-14 cursor-pointer w-full selectable-focus py-2',
        content: 'z-50'
      }"
      :portal="false"
      :required="required"
      :aria-label="triggerAriaLabel"
      :aria-describedby="ariaDescribedby"
      :aria-required="required ? 'true' : undefined"
      variant="subtle"
    >
      <template #trailing>
        <UIcon name="i-lucide-chevron-down" class="text-muted size-5 icon-animation" />
      </template>
    </USelectMenu>
    <UButton
      v-if="model"
      color="primary"
      variant="ghost"
      size="xs"
      icon="i-lucide-x"
      :aria-label="clearLabel || t('form.clear')"
      :ui="{
        base: 'selectable-focus cursor-pointer absolute end-8 top-1/2 -translate-y-1/2'
      }"
      @pointerdown.stop
      @click.stop="model = undefined"
      @keydown.enter.stop="model = undefined"
      @keydown.space.prevent.stop="model = undefined"
    />
  </div>
</template>
