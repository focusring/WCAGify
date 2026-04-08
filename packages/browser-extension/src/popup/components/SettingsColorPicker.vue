<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()

defineProps<{
  colors: readonly { name: string; value: string }[]
  modelValue: string | undefined
  name: string
  allowClear?: boolean
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()
</script>

<template>
  <fieldset
    class="flex items-center gap-4 rounded-xl w-fit p-2 -m-2 has-[input:focus-visible]:outline-[0.375rem] has-[input:focus-visible]:outline-double has-[input:focus-visible]:outline-primary has-[input:focus-visible]:shadow-[0_0_0_0.25rem_white]"
  >
    <legend class="sr-only">{{ label }}</legend>
    <label
      v-for="color in colors"
      :key="color.name"
      class="size-6 rounded-full cursor-pointer transition-transform duration-150 hover:scale-110 has-checked:outline-2 has-checked:outline-black dark:has-checked:outline-white has-checked:outline-offset-2"
      :style="{ backgroundColor: color.value }"
    >
      <input
        type="radio"
        :name="name"
        class="sr-only"
        :checked="modelValue === color.name"
        :aria-label="color.name"
        :value="color.name"
        @change="emit('update:modelValue', color.name)"
      />
    </label>
    <label
      v-if="allowClear"
      class="size-6 rounded-full cursor-pointer transition-transform duration-150 hover:scale-110 has-checked:outline-2 has-checked:outline-black dark:has-checked:outline-white has-checked:outline-offset-2 flex items-center justify-center border border-default"
    >
      <input
        type="radio"
        :name="name"
        class="sr-only"
        :checked="modelValue === undefined"
        :aria-label="t('settings.clearColor')"
        value=""
        @change="emit('update:modelValue', undefined)"
      />
      <UIcon name="i-lucide-ban" class="size-4 text-muted" aria-hidden="true" />
    </label>
  </fieldset>
</template>
