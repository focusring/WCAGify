<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'

const model = defineModel<string | undefined>()

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

withDefaults(
  defineProps<{
    id?: string
    items: { label: string; value: string }[]
    valueKey?: keyof { label: string; value: string }
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
</script>

<template>
  <div class="relative w-full">
    <USelect
      :id="id"
      v-model="model"
      :open="isOpen"
      @update:open="isOpen = $event"
      :items="items"
      :value-key="valueKey"
      :placeholder="placeholder"
      :ui="{
        placeholder: 'text-muted',
        item: 'cursor-pointer selectable-focus',
        base: 'pe-14',
        content: 'z-50'
      }"
      :portal="false"
      :required="required"
      :aria-required="required ? 'true' : undefined"
      variant="subtle"
      class="w-full cursor-pointer selectable-focus py-2"
    >
      <template #trailing>
        <UIcon name="i-lucide-chevron-down" class="text-muted size-5 icon-animation" />
      </template>
    </USelect>
    <UButton
      v-if="model"
      color="primary"
      variant="ghost"
      size="xs"
      icon="i-lucide-x"
      :aria-label="clearLabel || t('form.clear')"
      :ui="{
        base: 'selectable-focus cursor-pointer absolute right-8 top-1/2 -translate-y-1/2 z-10'
      }"
      @pointerdown.stop
      @click.stop="model = undefined"
      @keydown.enter.stop="model = undefined"
      @keydown.space.prevent.stop="model = undefined"
    />
  </div>
</template>
