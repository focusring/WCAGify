<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from '../../composables/useI18n'

const props = defineProps<{
  // Any CSS background value: a plain color for the copyable swatches, a full gradient for the decorative previews.
  color: string
  // Renders the bare swatch without the copy button, for gradient previews.
  // Their value is a synthesised approximation (gradientCss invents the direction), so copying it would mislead.
  decorative?: boolean
}>()
const { t } = useI18n()

// The value reads "Copied" for a moment after a successful write; the timer is cancelled on unmount.
const COPIED_RESET_MS = 1500
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined = undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.color)
  } catch {
    // Clipboard denied or unavailable leave the button in its idle state rather than claiming a copy.
    return
  }
  copied.value = true
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => (copied.value = false), COPIED_RESET_MS)
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <span
    v-if="decorative"
    class="inline-block size-3.5 rounded-sm border border-default shrink-0"
    :style="{ background: color }"
    aria-hidden="true"
  />
  <UButton
    v-else
    @click="copy"
    color="neutral"
    variant="outline"
    :aria-label="`${t('picker.copyColor')} ${color}`"
    :title="`${t('picker.copyColor')} ${color}`"
    :ui="{ base: 'gap-1.5 px-1.5 py-1 rounded-xl! min-w-23' }"
  >
    <span
      class="inline-block size-4.5 rounded border border-black dark:border-white shrink-0"
      :style="{ background: color }"
      aria-hidden="true"
    />
    <code class="whitespace-nowrap text-highlighted">
      {{ copied ? t('picker.copied') : color }}
    </code>
    <span aria-live="polite" aria-atomic="true" class="sr-only">
      {{ copied ? t('picker.copied') : '' }}
    </span>
  </UButton>
</template>
