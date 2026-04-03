<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'

const props = defineProps<{
  fgColor?: string
  bgColor?: string
}>()

const { t } = useI18n()

const localFg = ref(props.fgColor || '#000000')
const localBg = ref(props.bgColor || '#ffffff')
const fgText = ref(localFg.value)
const bgText = ref(localBg.value)
const pickerSelected = ref(false)

watch(
  () => props.fgColor,
  (val) => {
    if (val) {
      pickerSelected.value = true
      const bgHex = (props.bgColor && normalizeHex(props.bgColor)) || localBg.value
      const hex = normalizeHex(val, bgHex) ?? val
      localFg.value = hex
      fgText.value = hex
    }
  }
)
watch(
  () => props.bgColor,
  (val) => {
    if (val) {
      pickerSelected.value = true
      const hex = normalizeHex(val) ?? val
      localBg.value = hex
      bgText.value = hex
    }
  }
)
watch(localFg, (val) => {
  fgText.value = val
})
watch(localBg, (val) => {
  bgText.value = val
})

function compositeOnBg(
  rgba: { r: number; g: number; b: number; a: number },
  bgHex: string
): string {
  const { r, g, b, a } = rgba
  const bm = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(bgHex)
  const bgR = bm ? parseInt(bm[1], 16) : 255
  const bgG = bm ? parseInt(bm[2], 16) : 255
  const bgB = bm ? parseInt(bm[3], 16) : 255
  const blend = (src: number, bkg: number) => Math.round(a * src + (1 - a) * bkg)
  return `#${blend(r, bgR).toString(16).padStart(2, '0')}${blend(g, bgG).toString(16).padStart(2, '0')}${blend(b, bgB).toString(16).padStart(2, '0')}`
}

function normalizeHex(input: string, bgHex = '#ffffff'): string | undefined {
  const s = input.trim().replace(/^#+/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase()
  if (/^[0-9a-fA-F]{4}$/.test(s)) {
    const [r, g, b, a] = [
      parseInt(s[0] + s[0], 16),
      parseInt(s[1] + s[1], 16),
      parseInt(s[2] + s[2], 16),
      parseInt(s[3] + s[3], 16) / 255
    ]
    return compositeOnBg({ r, g, b, a }, bgHex)
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`.toLowerCase()
  if (/^[0-9a-fA-F]{8}$/.test(s)) {
    const [r, g, b, a] = [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
      parseInt(s.slice(6, 8), 16) / 255
    ]
    return compositeOnBg({ r, g, b, a }, bgHex)
  }
  return undefined
}

function handleFgInput(val: string) {
  fgText.value = val
  const hex = normalizeHex(val, localBg.value)
  if (hex) localFg.value = hex
}

function handleBgInput(val: string) {
  bgText.value = val
  const hex = normalizeHex(val)
  if (hex) localBg.value = hex
}

function swapColors() {
  const tmpFg = localFg.value
  localFg.value = localBg.value
  localBg.value = tmpFg
}

function toLinear(c: number): number {
  const s = c / 255
  return s <= 0.040_45 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number | undefined {
  const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return undefined
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

const ratio = computed(() => {
  const l1 = luminance(localFg.value)
  const l2 = luminance(localBg.value)
  if (l1 === undefined || l2 === undefined) return undefined
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
})

const ratioLabel = computed(() => {
  const r = ratio.value
  return r !== undefined ? `${r.toFixed(2)}:1` : '—'
})

const passAA = computed(() => (ratio.value ?? 0) >= 4.5)
const passAAA = computed(() => (ratio.value ?? 0) >= 7)
const passAALarge = computed(() => (ratio.value ?? 0) >= 3)
const passAAALarge = computed(() => (ratio.value ?? 0) >= 4.5)

function getTextColor(hex: string): string {
  const l = luminance(hex)
  return l !== undefined && l > 0.179 ? '#000000' : '#ffffff'
}

const fgInputStyle = computed(() =>
  pickerSelected.value ? { backgroundColor: localFg.value, color: getTextColor(localFg.value) } : {}
)
const bgInputStyle = computed(() => ({
  backgroundColor: localBg.value,
  color: getTextColor(localBg.value)
}))

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
  }
}

async function pickColor(target: 'fg' | 'bg') {
  const EyeDropperConstructor =
    typeof (globalThis as unknown as { EyeDropper?: unknown }).EyeDropper === 'function'
      ? (
          globalThis as unknown as {
            EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> }
          }
        ).EyeDropper
      : undefined
  if (!EyeDropperConstructor) return
  try {
    const result: { sRGBHex: string } = await new EyeDropperConstructor().open()
    const hex: string = result.sRGBHex
    if (target === 'fg') {
      localFg.value = hex
      fgText.value = hex
      pickerSelected.value = true
    } else {
      localBg.value = hex
      bgText.value = hex
    }
  } catch {
    // User cancelled
  }
}
</script>

<template>
  <div class="space-y-3 flex flex-col">
    <div class="md:flex gap-4 my-0 md:my-none">
      <!-- Preview -->
      <div class="w-full">
        <label class="block text-sm font-medium text-muted mb-1">
          {{ t('contrast.preview') }}
        </label>
        <div
          :style="{ backgroundColor: localBg, color: localFg }"
          class="rounded border border-gray-200 dark:border-gray-700 px-3 py-2 md:py-6"
        >
          <p class="text-sm">{{ t('contrast.normalText') }}: {{ t('contrast.sampleSentence') }}</p>
          <p class="text-lg font-bold">{{ t('contrast.largeText') }}: Aa</p>
        </div>
      </div>

      <!-- Color inputs -->
      <div class="space-y-3 md:space-y-2 my-3 md:my-0 w-full">
        <label for="fg-color-input" class="block text-sm font-medium text-muted mb-1">
          {{ t('contrast.foreground') }}
        </label>
        <div class="flex items-center gap-1">
          <input
            id="fg-color-input"
            type="color"
            v-model="localFg"
            :title="t('contrast.foreground')"
            :aria-label="t('contrast.foreground')"
            class="size-8 shrink-0 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
          />
          <UFieldGroup class="w-full">
            <UInput
              :model-value="fgText"
              @update:model-value="handleFgInput"
              :style="fgInputStyle"
              :aria-label="t('contrast.foreground')"
              spellcheck="false"
              class="w-full tracking-widest"
            />
            <UButton
              :aria-label="t('contrast.copy')"
              color="neutral"
              variant="subtle"
              icon="i-lucide-copy"
              :ui="{ base: 'shrink-0 cursor-pointer', leadingIcon: 'size-4' }"
              @click="copyToClipboard(localFg)"
            />
          </UFieldGroup>
        </div>

        <label for="bg-color-input" class="block text-sm font-medium text-muted mb-1">
          {{ t('contrast.background') }}
        </label>
        <div class="flex items-center gap-1">
          <input
            id="bg-color-input"
            type="color"
            v-model="localBg"
            :title="t('contrast.background')"
            :aria-label="t('contrast.background')"
            class="size-8 shrink-0 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
          />
          <UFieldGroup class="w-full">
            <UInput
              :model-value="bgText"
              @update:model-value="handleBgInput"
              :style="bgInputStyle"
              :aria-label="t('contrast.background')"
              spellcheck="false"
              class="w-full tracking-widest"
            />
            <UButton
              :aria-label="t('contrast.copy')"
              color="neutral"
              variant="subtle"
              icon="i-lucide-copy"
              :ui="{ base: 'shrink-0 cursor-pointer', leadingIcon: 'size-4' }"
              @click="copyToClipboard(localBg)"
            />
          </UFieldGroup>
        </div>
      </div>
    </div>

    <!-- Ratio + WCAG results -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ t('contrast.contrastRatio') }}
      </label>
      <UBadge
        :label="ratioLabel"
        :color="passAA ? 'success' : 'error'"
        variant="subtle"
        :icon="passAA ? 'i-lucide-check' : 'i-lucide-x'"
      />
    </div>
    <div class="grid grid-cols-2 md:flex md:gap-8 gap-x-3 gap-y-1">
      <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
        <UIcon
          :name="passAA ? 'i-lucide-check' : 'i-lucide-x'"
          class="size-3.5 shrink-0"
          :class="passAA ? 'text-success-500' : 'text-error-500'"
        />
        <span>AA {{ t('contrast.normalText') }} (4.5:1)</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
        <UIcon
          :name="passAAA ? 'i-lucide-check' : 'i-lucide-x'"
          class="size-3.5 shrink-0"
          :class="passAAA ? 'text-success-500' : 'text-error-500'"
        />
        <span>AAA {{ t('contrast.normalText') }} (7:1)</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
        <UIcon
          :name="passAALarge ? 'i-lucide-check' : 'i-lucide-x'"
          class="size-3.5 shrink-0"
          :class="passAALarge ? 'text-success-500' : 'text-error-500'"
        />
        <span>AA {{ t('contrast.largeText') }} (3:1)</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
        <UIcon
          :name="passAAALarge ? 'i-lucide-check' : 'i-lucide-x'"
          class="size-3.5 shrink-0"
          :class="passAAALarge ? 'text-success-500' : 'text-error-500'"
        />
        <span>AAA {{ t('contrast.largeText') }} (4.5:1)</span>
      </div>
    </div>
  </div>
</template>
