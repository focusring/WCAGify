<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import ColorSwatch from './ColorSwatch.vue'
import type { GradientInfo } from '../../content/picker/types'

// Preview + stop swatches for one gradient, shown the same way for an element's own fill and for the surface behind it.
const props = defineProps<{ gradient: GradientInfo }>()
const { t } = useI18n()

// Caps stops shown as swatches (rest summarised as "+N"); 3 covers common 2-/3-stop gradients without "+N" noise.
const STOPS_SHOWN = 3
const stopsShown = computed(() => props.gradient.colors.slice(0, STOPS_SHOWN))
const stopsMore = computed(() => Math.max(props.gradient.colors.length - STOPS_SHOWN, 0))
const typeLabel = computed(() => props.gradient.type.replace('-', ' '))
// Preview swatch with a synthesised direction, since stops carry no angle/position.
const previewCss = computed(() => {
  const direction = props.gradient.type.endsWith('linear') ? '90deg, ' : ''
  return `${props.gradient.type}-gradient(${direction}${props.gradient.colors.join(', ')})`
})
</script>

<template>
  <ColorSwatch :color="previewCss" decorative />
  <span class="text-highlighted"> {{ t('picker.gradient') }} {{ typeLabel }} </span>
  <ColorSwatch v-for="(color, i) in stopsShown" :key="i" :color="color" />
  <code v-if="stopsMore" class="text-highlighted"> +{{ stopsMore }} </code>
</template>
