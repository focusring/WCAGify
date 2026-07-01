<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import type { ElementInfo, GradientInfo } from '../../content/picker/types'

const props = defineProps<{ info: ElementInfo; child?: boolean }>()
const { t } = useI18n()

const mediaLabel = computed(() => {
  const m = props.info.media
  if (!m) return ''
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

// Gradient stops are truncated to the first two with a "+N" indicator, keeping the row short for many-stop gradients.
const gradientStopsShown = (g?: GradientInfo | null) => g?.colors.slice(0, 2) ?? []
const gradientStopsMore = (g?: GradientInfo | null) => Math.max((g?.colors.length ?? 0) - 2, 0)
// A preview swatch rendered with the actual gradient (synthesised direction, since stops carry no angle/position).
const gradientCss = (g?: GradientInfo | null) => {
  if (!g) return ''
  const direction = g.type === 'linear' ? '90deg, ' : ''
  return `${g.type}-gradient(${direction}${g.colors.join(', ')})`
}
</script>

<template>
  <div class="space-y-1">
    <div v-if="child && (info.label || info.selector)" class="space-y-0.5">
      <div v-if="info.label" class="font-medium text-highlighted">{{ info.label }}</div>
      <code class="block break-all text-toned">{{ info.selector }}</code>
    </div>
    <div v-if="info.role || info.ariaHidden || info.disabled">
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
      <span
        v-for="(color, i) in info.textColors"
        :key="`text-${i}`"
        class="flex items-center gap-1"
      >
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: color }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ color }}</code>
      </span>
    </div>
    <div v-if="info.iconColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.icon') }}:</span>
      <span
        v-for="(color, i) in info.iconColors"
        :key="`icon-${i}`"
        class="flex items-center gap-1"
      >
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: color }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ color }}</code>
      </span>
    </div>
    <div
      v-if="info.elementColor || info.elementGradient"
      class="flex flex-wrap items-center gap-x-2 gap-y-1"
    >
      <span class="label-title">{{ t('picker.element') }}:</span>
      <template v-if="info.elementGradient">
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ background: gradientCss(info.elementGradient) }"
          aria-hidden="true"
        />
        <span class="text-highlighted">{{ t('picker.gradient') }}</span>
        <span
          v-for="(color, i) in gradientStopsShown(info.elementGradient)"
          :key="`egrad-${i}`"
          class="flex items-center gap-1"
        >
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
        <code v-if="gradientStopsMore(info.elementGradient)" class="text-highlighted">
          +{{ gradientStopsMore(info.elementGradient) }}
        </code>
      </template>
      <span v-if="info.elementColor" class="flex items-center gap-1">
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: info.elementColor }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ info.elementColor }}</code>
      </span>
    </div>
    <div v-if="info.borderColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.border') }}:</span>
      <span
        v-for="(color, i) in info.borderColors"
        :key="`border-${i}`"
        class="flex items-center gap-1"
      >
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: color }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ color }}</code>
      </span>
    </div>
    <div v-if="info.ringColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.ring') }}:</span>
      <span
        v-for="(color, i) in info.ringColors"
        :key="`ring-${i}`"
        class="flex items-center gap-1"
      >
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: color }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ color }}</code>
      </span>
    </div>
    <div v-if="info.boxShadowColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.boxShadow') }}:</span>
      <span
        v-for="(color, i) in info.boxShadowColors"
        :key="`shadow-${i}`"
        class="flex items-center gap-1"
      >
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: color }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ color }}</code>
      </span>
    </div>
    <div v-if="info.outlineColor" class="flex items-center gap-1">
      <span class="label-title">{{ t('picker.outline') }}:</span>
      <span
        class="ml-1 inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
        :style="{ backgroundColor: info.outlineColor }"
        aria-hidden="true"
      />
      <code class="text-highlighted">{{ info.outlineColor }}</code>
    </div>
    <div v-if="hasBackground" class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="label-title">{{ t('picker.background') }}:</span>
      <code v-if="info.background.media" class="text-highlighted">{{ backgroundMediaLabel }}</code>
      <span v-if="info.background.blur" class="text-highlighted">{{ t('picker.blur') }}</span>
      <template v-if="info.background.gradient">
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ background: gradientCss(info.background.gradient) }"
          aria-hidden="true"
        />
        <span class="text-highlighted">{{ t('picker.gradient') }}</span>
        <span
          v-for="(color, i) in gradientStopsShown(info.background.gradient)"
          :key="`grad-${i}`"
          class="flex items-center gap-1"
        >
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
        <code v-if="gradientStopsMore(info.background.gradient)" class="text-highlighted">
          +{{ gradientStopsMore(info.background.gradient) }}
        </code>
      </template>
      <span v-if="info.background.color" class="flex items-center gap-1">
        <span
          class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: info.background.color }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ info.background.color }}</code>
      </span>
    </div>
  </div>
</template>
