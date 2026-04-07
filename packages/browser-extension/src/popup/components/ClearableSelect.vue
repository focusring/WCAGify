<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'

const model = defineModel<string | undefined>()

withDefaults(
  defineProps<{
    id?: string
    items: { label: string; value: string }[]
    valueKey?: string
    placeholder?: string
    required?: boolean
    clearLabel?: string
  }>(),
  {
    valueKey: 'value',
    required: false,
    clearLabel: undefined
  }
)

const { t } = useI18n()

function onSelectKeydown(e: KeyboardEvent) {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.target?.dispatchEvent(
    new KeyboardEvent('keydown', { key: e.key, bubbles: true, cancelable: true })
  )
}
</script>

<template>
  <USelect
    :id="id"
    v-model="model"
    :items="items"
    :value-key="valueKey"
    :placeholder="placeholder"
    :ui="{
      placeholder: 'text-muted',
      item: 'cursor-pointer data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-inset data-highlighted:not-data-disabled:before:ring-primary'
    }"
    :content="{ onKeydown: onSelectKeydown }"
    :required="required"
    :aria-required="required ? 'true' : undefined"
    variant="subtle"
    class="w-full cursor-pointer py-2"
  >
    <template #trailing="{ modelValue }">
      <UButton
        v-if="modelValue"
        as="span"
        tabindex="0"
        color="primary"
        variant="ghost"
        size="xs"
        icon="i-lucide-x"
        :aria-label="clearLabel || t('form.clear')"
        :ui="{
          base: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
        }"
        class="cursor-pointer mr-1"
        @pointerdown.stop
        @click.stop="model = undefined"
        @keydown.enter.stop="model = undefined"
        @keydown.space.prevent.stop="model = undefined"
      />
      <UIcon
        name="i-lucide-chevron-down"
        class="text-muted size-5 group-data-[state=open]:rotate-180 transition-transform duration-200"
      />
    </template>
  </USelect>
</template>
