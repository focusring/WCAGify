<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()

interface MediaInfo {
  kind: 'image' | 'video'
  format: string
}

interface GradientInfo {
  type: string
  colors: string[]
}

interface BackgroundInfo {
  color: string
  media: MediaInfo | null
  gradient: GradientInfo | null
  blur: boolean
}

function toHex(color: string): string {
  if (!color) return color
  const hex = color.match(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (hex) return color.toLowerCase()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a === 255) {
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  }
  return '#' + [r, g, b, a].map((v) => v.toString(16).padStart(2, '0')).join('')
}

const selector = ref('')
const pageUrl = ref('')
const pageTitle = ref('')
const role = ref('')
const ariaHidden = ref(false)
const textColors = ref<string[]>([])
const iconColors = ref<string[]>([])
const elementColor = ref('')
const elementGradient = ref<GradientInfo | null>(null)
const background = ref<BackgroundInfo | null>(null)
const borderColors = ref<string[]>([])
const ringColors = ref<string[]>([])
const boxShadowColors = ref<string[]>([])
const outlineColor = ref('')
const media = ref<MediaInfo | null>(null)
const picking = ref(false)

const mediaLabel = computed(() => {
  if (!media.value) return ''
  const kind = t(media.value.kind === 'image' ? 'picker.image' : 'picker.video')
  return media.value.format ? `${kind} .${media.value.format}` : `${kind} (${t('picker.unknown')})`
})

const hasBackground = computed(() => {
  const bg = background.value
  return !!bg && !!(bg.color || bg.media || bg.gradient || bg.blur)
})
// Three-part label "<type> <format>" reusing the media value's kind/format detection. GIFs get their own type word.
const backgroundMediaLabel = computed(() => {
  const m = background.value?.media
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
const pickerTabId = ref<number | undefined>()
const selectedTabId = ref<number | undefined>()

defineExpose({
  selector,
  pageUrl,
  pageTitle,
  role,
  ariaHidden,
  textColors,
  iconColors,
  elementColor,
  elementGradient,
  background,
  borderColors,
  ringColors,
  boxShadowColors,
  outlineColor,
  media,
  selectedTabId
})

function onMessage(message: {
  type: string
  selector?: string
  url?: string
  pageTitle?: string
  role?: string
  ariaHidden?: boolean
  textColors?: string[]
  iconColors?: string[]
  elementColor?: string
  elementGradient?: GradientInfo | null
  background?: BackgroundInfo | null
  borderColors?: string[]
  ringColors?: string[]
  boxShadowColors?: string[]
  outlineColor?: string
  media?: { kind: 'image' | 'video'; format: string } | null
}) {
  if (message.type === 'element-picked') {
    selector.value = message.selector ?? ''
    pageUrl.value = message.url ?? ''
    pageTitle.value = message.pageTitle ?? ''
    role.value = message.role ?? ''
    ariaHidden.value = message.ariaHidden ?? false
    textColors.value = (message.textColors ?? []).map(toHex)
    iconColors.value = (message.iconColors ?? []).map(toHex)
    elementColor.value = toHex(message.elementColor ?? '')
    const eg = message.elementGradient ?? null
    elementGradient.value = eg ? { type: eg.type, colors: eg.colors.map(toHex) } : null
    const bg = message.background ?? null
    background.value = bg
      ? {
          color: toHex(bg.color),
          media: bg.media,
          gradient: bg.gradient
            ? { type: bg.gradient.type, colors: bg.gradient.colors.map(toHex) }
            : null,
          blur: bg.blur
        }
      : null
    borderColors.value = (message.borderColors ?? []).map(toHex)
    ringColors.value = (message.ringColors ?? []).map(toHex)
    boxShadowColors.value = (message.boxShadowColors ?? []).map(toHex)
    outlineColor.value = toHex(message.outlineColor ?? '')
    media.value = message.media ?? null
    selectedTabId.value = pickerTabId.value
    picking.value = false
    pickerTabId.value = undefined
  }
  if (message.type === 'picker-cancelled') {
    picking.value = false
    pickerTabId.value = undefined
  }
}

function cancelPicker() {
  if (!picking.value) return
  picking.value = false
  if (pickerTabId.value !== undefined) {
    chrome.tabs.sendMessage(pickerTabId.value, { type: 'cancel-picker' }).catch(() => {})
    pickerTabId.value = undefined
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') cancelPicker()
}

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessage)
  globalThis.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  cancelPicker()
  chrome.runtime.onMessage.removeListener(onMessage)
  globalThis.removeEventListener('keydown', onKeyDown)
})

async function pickElement() {
  // Side panel lives in the same window — find the active page tab directly
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs.find(
    (item) => item.url && !item.url.startsWith('chrome') && !item.url.startsWith('extension')
  )
  if (!tab?.id) return

  pickerTabId.value = tab.id
  selectedTabId.value = undefined
  picking.value = true
  selector.value = ''
  pageUrl.value = ''
  pageTitle.value = ''
  role.value = ''
  ariaHidden.value = false
  textColors.value = []
  iconColors.value = []
  elementColor.value = ''
  elementGradient.value = null
  background.value = null
  borderColors.value = []
  ringColors.value = []
  boxShadowColors.value = []
  outlineColor.value = ''
  media.value = null

  chrome.tabs.sendMessage(tab.id, { type: 'start-picker' }).catch(() => {
    picking.value = false
  })
}
</script>

<template>
  <div class="space-y-2">
    <UButton
      @click="pickElement"
      :disabled="picking"
      variant="outline"
      icon="i-lucide-square-mouse-pointer"
      size="xl"
      :ui="{ leadingIcon: 'size-5', base: 'w-full justify-center' }"
      :label="picking ? t('picker.picking') : t('picker.pickElement')"
    />

    <div v-if="selector" class="space-y-1 rounded bg-muted p-2 text-sm">
      <div>
        <span class="label-title">{{ t('picker.selector') }}</span>
        <code class="ml-1 break-all text-highlighted">{{ selector }}</code>
      </div>
      <div>
        <span class="label-title">{{ t('picker.url') }}</span>
        <span class="ml-1 break-all text-highlighted">{{ pageUrl }}</span>
      </div>
      <div>
        <span class="label-title">{{ t('picker.page') }}</span>
        <span class="ml-1 text-highlighted">{{ pageTitle }}</span>
      </div>
      <div v-if="role || ariaHidden">
        <span class="label-title">{{ t('picker.role') }}:</span>
        <code v-if="role" class="ml-1 text-highlighted">{{ role }}</code>
        <span v-if="ariaHidden" class="ml-1 text-highlighted">{{
          role ? `(${t('picker.ariaHidden')})` : t('picker.ariaHidden')
        }}</span>
      </div>
      <div v-if="media">
        <span class="label-title">{{ t('picker.media') }}:</span>
        <span class="ml-1 text-highlighted">{{ mediaLabel }}</span>
      </div>
      <div v-if="textColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.text') }}:</span>
        <span v-for="(color, i) in textColors" :key="`text-${i}`" class="flex items-center gap-1">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
      </div>
      <div v-if="iconColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.icon') }}:</span>
        <span v-for="(color, i) in iconColors" :key="`icon-${i}`" class="flex items-center gap-1">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
      </div>
      <div
        v-if="elementColor || elementGradient"
        class="flex flex-wrap items-center gap-x-2 gap-y-1"
      >
        <span class="label-title">{{ t('picker.element') }}:</span>
        <template v-if="elementGradient">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ background: gradientCss(elementGradient) }"
            aria-hidden="true"
          />
          <span class="text-highlighted">{{ t('picker.gradient') }}</span>
          <span
            v-for="(color, i) in gradientStopsShown(elementGradient)"
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
          <code v-if="gradientStopsMore(elementGradient)" class="text-highlighted">
            +{{ gradientStopsMore(elementGradient) }}
          </code>
        </template>
        <span v-if="elementColor" class="flex items-center gap-1">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: elementColor }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ elementColor }}</code>
        </span>
      </div>
      <div v-if="hasBackground" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.background') }}:</span>
        <code v-if="background?.media" class="text-highlighted">{{ backgroundMediaLabel }}</code>
        <span v-if="background?.blur" class="text-highlighted">{{ t('picker.blur') }}</span>
        <template v-if="background?.gradient">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ background: gradientCss(background.gradient) }"
            aria-hidden="true"
          />
          <span class="text-highlighted">{{ t('picker.gradient') }}</span>
          <span
            v-for="(color, i) in gradientStopsShown(background.gradient)"
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
          <code v-if="gradientStopsMore(background.gradient)" class="text-highlighted">
            +{{ gradientStopsMore(background.gradient) }}
          </code>
        </template>
        <span v-if="background?.color" class="flex items-center gap-1">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: background.color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ background.color }}</code>
        </span>
      </div>
      <div v-if="borderColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.border') }}:</span>
        <span
          v-for="(color, i) in borderColors"
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
      <div v-if="ringColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.ring') }}:</span>
        <span v-for="(color, i) in ringColors" :key="`ring-${i}`" class="flex items-center gap-1">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
      </div>
      <div v-if="boxShadowColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.boxShadow') }}:</span>
        <span
          v-for="(color, i) in boxShadowColors"
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
      <div v-if="outlineColor" class="flex items-center gap-1">
        <span class="label-title">{{ t('picker.outline') }}:</span>
        <span
          class="ml-1 inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: outlineColor }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ outlineColor }}</code>
      </div>
    </div>
  </div>
</template>
