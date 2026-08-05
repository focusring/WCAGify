<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import ColorSwatch from './ColorSwatch.vue'
import type { ElementInfo, GradientInfo } from '../../content/picker/types'

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

const gradientTypeLabel = (g?: GradientInfo | null) => g?.type.replace('-', ' ') ?? ''

// Caps stops shown as swatches (rest summarised as "+N"); 3 covers common 2-/3-stop gradients without "+N" noise.
const GRADIENT_STOPS_SHOWN = 3
const gradientStopsShown = (g?: GradientInfo | null) =>
  g?.colors.slice(0, GRADIENT_STOPS_SHOWN) ?? []
const gradientStopsMore = (g?: GradientInfo | null) =>
  Math.max((g?.colors.length ?? 0) - GRADIENT_STOPS_SHOWN, 0)
// Preview swatch with a synthesised direction, since stops carry no angle/position.
const gradientCss = (g?: GradientInfo | null) => {
  if (!g) return ''
  const direction = g.type.endsWith('linear') ? '90deg, ' : ''
  return `${g.type}-gradient(${direction}${g.colors.join(', ')})`
}
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

      <!-- Border Colors -->
      <div v-if="info.borderColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.border') }}:</span>
        <ColorSwatch v-for="(color, i) in info.borderColors" :key="`border-${i}`" :color="color" />
      </div>

      <!-- Ring Colors -->
      <div v-if="info.ringColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.ring') }}:</span>
        <ColorSwatch v-for="(color, i) in info.ringColors" :key="`ring-${i}`" :color="color" />
      </div>

      <!-- Box Shadow Colors -->
      <div v-if="info.boxShadowColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.boxShadow') }}:</span>
        <ColorSwatch
          v-for="(color, i) in info.boxShadowColors"
          :key="`shadow-${i}`"
          :color="color"
        />
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
  </div>
</template>
