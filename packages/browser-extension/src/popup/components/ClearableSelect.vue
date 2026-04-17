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
      base: ' pe-7.5 selectable-focus py-1.5 h-9',
      placeholder: 'text-muted',
      trailingIcon: 'text-muted icon-animation',
      item: 'cursor-pointer selectable-focus hover:bg-muted',
      content: 'z-50'
    }"
    :required="required"
    :portal="false"
    :aria-required="required ? 'true' : undefined"
    variant="subtle"
    class="w-full cursor-pointer"
  >
    <template #default>
      <span v-if="model" class="truncate">{{
        items.find((i) => i.value === model)?.label ?? model
      }}</span>
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
        :aria-label="clearLabel || t('form.clear')"
        :ui="{ base: 'selectable-focus cursor-pointer ml-auto' }"
        @pointerdown.stop
        @click.stop="model = ''"
        @keydown.enter.stop="model = ''"
        @keydown.space.prevent.stop="model = ''"
      />
    </template>
  </USelectMenu>
</template>
