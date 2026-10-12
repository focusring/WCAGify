<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../../composables/useI18n'

// The info button beside a field label, with the field's hint in a popover.
// No live region or aria-expanded: opening moves focus into the popover's role="dialog" content, which announces the text.
// The open state only labels the button, so each field's hint owns it rather than the form tracking one flag per field.
const props = defineProps<{ label: string; description: string }>()
const { t } = useI18n()

const open = ref(false)
</script>

<template>
  <UPopover v-model:open="open" :content="{ sideOffset: 4, collisionPadding: 16 }">
    <UButton
      :aria-label="`${open ? t('form.descBtnClose') : t('form.descBtnOpen')} ${props.label}`"
      icon="i-lucide-info"
      size="xs"
      color="neutral"
      variant="ghost"
    />
    <template #content>
      <p
        class="label-hint text-sm p-2 w-(--reka-popover-content-available-width) sm:w-auto sm:max-w-(--reka-popover-content-available-width)"
      >
        {{ props.description }}
      </p>
    </template>
  </UPopover>
</template>
