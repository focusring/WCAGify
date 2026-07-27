<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import ColorSwatch from './ColorSwatch.vue'
import type { ElementInfo, GradientInfo } from '../../content/picker/types'

// snapshot marks a section restored from history: the values are frozen and no live element backs them, so stepping into a child is disabled rather than silently doing nothing.
const props = defineProps<{ info: ElementInfo; child?: boolean; snapshot?: boolean }>()
// Navigation intents for this child section; the panel owns the index, so none of them carry a payload.
// A preview/preview-end pair brackets a hover or focus of the button, outlining the target on the page without selecting it.
const emit = defineEmits<{ select: []; preview: []; 'preview-end': [] }>()
const { t } = useI18n()

// How many identical children this section stands for (collectChildSections merges them); 1 when unmerged.
const mergedCount = computed(() => props.info.count ?? 1)

// Parenthetical suffix explaining why an iframe's inner content isn't detected. '' for a detected frame ('content').
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
// Three-part label "<type> <format>" reusing the media value's kind/format detection. GIFs get their own type word.
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

// Easier gradient type from the detected CSS function name: "conic", "linear", "repeating linear", …
const gradientTypeLabel = (g?: GradientInfo | null) => g?.type.replace('-', ' ') ?? ''

// Stop colors show as swatches, capped at the first GRADIENT_STOPS_SHOWN; the rest of the same gradient's stops are summarised as "+N".
// A cap of 3 keeps the row readable while showing every stop of common 2- and 3-stop gradients, so "+N" only appears at 4+ stops.
const GRADIENT_STOPS_SHOWN = 3
const gradientStopsShown = (g?: GradientInfo | null) =>
  g?.colors.slice(0, GRADIENT_STOPS_SHOWN) ?? []
const gradientStopsMore = (g?: GradientInfo | null) =>
  Math.max((g?.colors.length ?? 0) - GRADIENT_STOPS_SHOWN, 0)
// A preview swatch rendered with the actual gradient (synthesised direction, since stops carry no angle/position).
const gradientCss = (g?: GradientInfo | null) => {
  if (!g) return ''
  const direction = g.type.endsWith('linear') ? '90deg, ' : ''
  return `${g.type}-gradient(${direction}${g.colors.join(', ')})`
}
</script>

<template>
  <div class="space-y-1">
    <div v-if="child" class="flex items-start justify-between gap-2">
      <div class="min-w-0 space-y-0.5">
        <div
          v-if="info.label || mergedCount > 1 || info.role || info.ariaHidden || info.disabled"
          class="flex flex-wrap items-center gap-x-1.5 gap-y-1"
        >
          <span v-if="info.label" class="font-medium text-highlighted">{{ info.label }}</span>
          <span v-else class="font-medium italic text-toned">{{ t('picker.noName') }}</span>
          <span v-if="mergedCount > 1" class="text-toned">×{{ mergedCount }}</span>
          <UBadge
            v-if="info.role"
            :label="info.role"
            :title="t('picker.role')"
            variant="outline"
            size="lg"
          />
          <UBadge
            v-if="info.ariaHidden"
            color="neutral"
            variant="subtle"
            size="sm"
            :title="t('picker.ariaHidden')"
            :label="t('picker.ariaHiddenShort')"
          />
          <UBadge
            v-if="info.disabled"
            color="neutral"
            variant="subtle"
            size="sm"
            :label="t('picker.disabled')"
          />
        </div>
        <code class="block break-all text-toned">{{ info.selector }}</code>
      </div>
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
    <div v-if="!child && (info.role || info.ariaHidden || info.disabled)">
      <span class="label-title">{{ t('picker.role') }}:</span>
      <code v-if="info.role" class="ml-1 text-highlighted">{{ info.role }}</code>
      <span v-if="info.ariaHidden" class="ml-1 text-toned">({{ t('picker.ariaHidden') }})</span>
      <span v-if="info.disabled" class="ml-1 text-toned">({{ t('picker.disabled') }})</span>
    </div>
    <div v-if="info.media">
      <span class="label-title">{{ t('picker.media') }}:</span>
      <span class="ml-1 text-highlighted">{{ mediaLabel }}</span>
    </div>
    <div v-if="info.textColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.text') }}:</span>
      <ColorSwatch v-for="(color, i) in info.textColors" :key="`text-${i}`" :color="color" />
    </div>
    <div v-if="info.iconColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.icon') }}:</span>
      <ColorSwatch v-for="(color, i) in info.iconColors" :key="`icon-${i}`" :color="color" />
    </div>
    <div
      v-if="info.elementColor || info.elementGradient"
      class="flex flex-wrap items-center gap-x-2 gap-y-1"
    >
      <span class="label-title">{{ t('picker.element') }}:</span>
      <template v-if="info.elementGradient">
        <ColorSwatch :color="gradientCss(info.elementGradient)" decorative />
        <span class="text-highlighted">
          {{ t('picker.gradient') }} {{ gradientTypeLabel(info.elementGradient) }}
        </span>
        <ColorSwatch
          v-for="(color, i) in gradientStopsShown(info.elementGradient)"
          :key="`egrad-${i}`"
          :color="color"
        />
        <code v-if="gradientStopsMore(info.elementGradient)" class="text-highlighted">
          +{{ gradientStopsMore(info.elementGradient) }}
        </code>
      </template>
      <ColorSwatch v-if="info.elementColor" :color="info.elementColor" />
    </div>
    <div v-if="info.borderColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.border') }}:</span>
      <ColorSwatch v-for="(color, i) in info.borderColors" :key="`border-${i}`" :color="color" />
    </div>
    <div v-if="info.ringColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.ring') }}:</span>
      <ColorSwatch v-for="(color, i) in info.ringColors" :key="`ring-${i}`" :color="color" />
    </div>
    <div v-if="info.boxShadowColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.boxShadow') }}:</span>
      <ColorSwatch v-for="(color, i) in info.boxShadowColors" :key="`shadow-${i}`" :color="color" />
    </div>
    <div v-if="info.outlineColor" class="flex items-center gap-1">
      <span class="label-title">{{ t('picker.outline') }}:</span>
      <ColorSwatch :color="info.outlineColor" />
    </div>
    <div v-if="hasBackground" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.background') }}:</span>
      <code v-if="info.background.media" class="text-highlighted">{{ backgroundMediaLabel }}</code>
      <span v-if="info.background.blur" class="text-highlighted">{{ t('picker.blur') }}</span>
      <template v-if="info.background.gradient">
        <ColorSwatch :color="gradientCss(info.background.gradient)" decorative />
        <span class="text-highlighted">
          {{ t('picker.gradient') }} {{ gradientTypeLabel(info.background.gradient) }}
        </span>
        <ColorSwatch
          v-for="(color, i) in gradientStopsShown(info.background.gradient)"
          :key="`grad-${i}`"
          :color="color"
        />
        <code v-if="gradientStopsMore(info.background.gradient)" class="text-highlighted">
          +{{ gradientStopsMore(info.background.gradient) }}
        </code>
      </template>
      <ColorSwatch v-if="info.background.color" :color="info.background.color" />
    </div>
    <div v-if="info.hasHoverStyles" class="text-toned">{{ t('picker.hasHoverStyles') }}</div>
  </div>
</template>
