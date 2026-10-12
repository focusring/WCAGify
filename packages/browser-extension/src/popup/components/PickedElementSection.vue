<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import ColorSwatch from './ColorSwatch.vue'
import GradientSwatches from './GradientSwatches.vue'
import type { ElementInfo } from '../../content/picker/types'

// snapshot: a frozen history restore with no live element, so stepping into a child is disabled rather than silently failing.
const props = defineProps<{ info: ElementInfo; child?: boolean; snapshot?: boolean }>()
// Navigation intents (index owned by the panel); preview/preview-end bracket a hover or focus to outline the target without selecting it.
const emit = defineEmits<{ select: []; preview: []; 'preview-end': [] }>()
const { t } = useI18n()

// How many identical children this section stands for; 1 when unmerged.
const mergedCount = computed(() => props.info.count ?? 1)

const iframeStateLabel = (state: string): string => {
  if (state === 'empty') return t('picker.iframeEmpty')
  if (state === 'cross-origin') return t('picker.iframeCrossOrigin')
  if (state === 'inaccessible') return t('picker.iframeInaccessible')
  return ''
}

const mediaLabel = computed(() => {
  const m = props.info.media
  if (!m) return ''
  if (m.kind === 'iframe') {
    const state = m.iframeState ? iframeStateLabel(m.iframeState) : ''
    return state ? `${t('picker.iframe')} (${state})` : t('picker.iframe')
  }
  const kind = t(m.kind === 'image' ? 'picker.image' : 'picker.video')
  return m.format ? `${kind} .${m.format}` : `${kind} (${t('picker.unknown')})`
})

const hasBackground = computed(() => {
  const bg = props.info.background
  return !!(bg.color || bg.media || bg.gradient || bg.blur)
})
// "<type> <format>" label; GIFs get their own type word instead of "image".
const backgroundMediaLabel = computed(() => {
  const m = props.info.background.media
  if (!m) return ''
  const type =
    m.kind === 'video'
      ? t('picker.video')
      : m.format === 'gif'
        ? t('picker.gif')
        : t('picker.image')
  return m.format ? `${type} ${m.format}` : `${type} (${t('picker.unknown')})`
})

// Rows that are just a label plus swatches, with no per-color sources; empty ones are dropped so the template needs no guard.
const colorRows = computed(() =>
  [
    { key: 'border', label: t('picker.border'), colors: props.info.borderColors },
    { key: 'ring', label: t('picker.ring'), colors: props.info.ringColors },
    { key: 'shadow', label: t('picker.boxShadow'), colors: props.info.boxShadowColors }
  ].filter((row) => row.colors.length)
)
</script>

<template>
  <div class="space-y-1">
    <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span v-if="info.label" class="font-medium text-highlighted">{{ info.label }}</span>
      <span v-else class="font-medium italic text-toned">{{ t('picker.noName') }}</span>
      <span v-if="mergedCount > 1" class="text-toned">×{{ mergedCount }}</span>
      <UBadge
        v-if="info.role"
        :label="info.role"
        :title="t('picker.role')"
        variant="outline"
        size="lg"
        :ui="{ base: 'px-2.5 py-0.5 rounded-full' }"
      />
      <UBadge
        v-if="info.ariaHidden"
        color="info"
        variant="subtle"
        size="lg"
        :title="t('picker.ariaHidden')"
        :label="t('picker.ariaHiddenShort')"
        :ui="{ base: 'px-2.5 py-0.5 rounded-full' }"
      />
      <UBadge
        v-if="info.disabled"
        color="neutral"
        variant="subtle"
        size="sm"
        :label="t('picker.disabled')"
        :ui="{ base: 'px-2.5 py-0.5 rounded-full' }"
      />
    </div>

    <div v-if="child" class="flex items-start gap-2">
      <code class="block min-w-0 flex-1 break-all text-toned">{{ info.selector }}</code>
      <UButton
        @click="emit('select')"
        @mouseenter="emit('preview')"
        @mouseleave="emit('preview-end')"
        @focus="emit('preview')"
        @blur="emit('preview-end')"
        :disabled="snapshot"
        icon="i-lucide-arrow-down"
        color="neutral"
        variant="outline"
        :label="t('picker.selectChild')"
        :ui="{ base: 'shrink-0 gap-1 px-1.5 py-1', leadingIcon: 'size-4.5' }"
      />
    </div>

    <div class="sm:grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 flex flex-col gap-y-1.5">
      <!-- Text Colors -->
      <div
        v-if="info.textColors.length"
        class="flex flex-wrap items-center gap-2 lg:col-span-4 md:col-span-3 sm:col-span-2"
      >
        <span class="label-title">{{ t('picker.text') }}:</span>
        <ColorSwatch
          v-for="(color, i) in info.textColors"
          :key="`text-${i}`"
          :color="color"
          :sources="info.textColorSources?.[i]"
        />
      </div>

      <!-- Text Decoration Colors -->
      <div v-if="info.decorationColors?.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.textDecoration') }}:</span>
        <span
          v-for="(color, i) in info.decorationColors"
          :key="`decoration-${i}`"
          class="inline-flex items-center gap-1"
        >
          <ColorSwatch :color="color" :sources="info.decorationColorSources?.[i]" />
          <code class="text-highlighted">{{ info.decorationLines?.[i] }}</code>
        </span>
      </div>

      <!-- Highlight Colors -->
      <div v-if="info.highlightColors?.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.highlight') }}:</span>
        <ColorSwatch
          v-for="(color, i) in info.highlightColors"
          :key="`highlight-${i}`"
          :color="color"
          :sources="info.highlightColorSources?.[i]"
        />
      </div>

      <!-- Media -->
      <div v-if="info.media">
        <span class="label-title">{{ t('picker.media') }}:</span>
        <span class="ml-1 text-highlighted">{{ mediaLabel }}</span>
      </div>

      <!-- Icon Colors -->
      <div v-if="info.iconColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.icon') }}:</span>
        <ColorSwatch
          v-for="(color, i) in info.iconColors"
          :key="`icon-${i}`"
          :color="color"
          :sources="info.iconColorSources?.[i]"
        />
      </div>

      <!-- Element Color/Gradient -->
      <div
        v-if="info.elementColor || info.elementGradient"
        class="flex flex-wrap items-center gap-x-2 gap-y-1"
      >
        <span class="label-title">{{ t('picker.element') }}:</span>
        <GradientSwatches v-if="info.elementGradient" :gradient="info.elementGradient" />
        <ColorSwatch v-if="info.elementColor" :color="info.elementColor" />
      </div>

      <!-- Border / Ring / Box Shadow Colors -->
      <div
        v-for="row in colorRows"
        :key="row.key"
        class="flex flex-wrap items-center gap-x-2 gap-y-1"
      >
        <span class="label-title">{{ row.label }}:</span>
        <ColorSwatch v-for="(color, i) in row.colors" :key="`${row.key}-${i}`" :color="color" />
      </div>

      <!-- Outline Color -->
      <div v-if="info.outlineColor" class="flex items-center gap-1">
        <span class="label-title">{{ t('picker.outline') }}:</span>
        <ColorSwatch :color="info.outlineColor" />
      </div>

      <!-- Background -->
      <div v-if="hasBackground" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.background') }}:</span>
        <code v-if="info.background.media" class="text-highlighted">{{
          backgroundMediaLabel
        }}</code>
        <span v-if="info.background.blur" class="text-highlighted">{{ t('picker.blur') }}</span>
        <GradientSwatches v-if="info.background.gradient" :gradient="info.background.gradient" />
        <ColorSwatch v-if="info.background.color" :color="info.background.color" />
      </div>
    </div>
  </div>
</template>
