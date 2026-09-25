<script setup lang="ts">
defineProps<{
  colors: readonly { name: string; value: string; label: string }[]
  modelValue: string | undefined
  name: string
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()
</script>

<template>
  <fieldset
    class="flex flex-wrap items-start gap-x-2 gap-y-3 rounded-xl min-w-0 p-2 selectable-focus"
  >
    <legend class="sr-only">{{ label }}</legend>
    <label
      v-for="color in colors"
      :key="color.name"
      class="group flex flex-col items-center gap-1.5 min-w-12 cursor-pointer text-xs text-toned has-checked:text-default has-checked:font-medium"
    >
      <input
        type="radio"
        :name="name"
        class="sr-only peer"
        :checked="modelValue === color.name"
        :value="color.name"
        @change="emit('update:modelValue', color.name)"
      />
      <span
        class="size-6 rounded-full transition-transform duration-150 group-hover:scale-110 peer-checked:outline-2 peer-checked:outline-black dark:peer-checked:outline-white peer-checked:outline-offset-2"
        :style="{ backgroundColor: color.value }"
        aria-hidden="true"
      />
      <span class="whitespace-nowrap">{{ color.label }}</span>
    </label>
  </fieldset>
</template>
