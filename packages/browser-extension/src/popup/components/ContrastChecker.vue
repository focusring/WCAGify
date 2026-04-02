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
      localFg.value = val
      fgText.value = val
    }
  }
)
watch(
  () => props.bgColor,
  (val) => {
    if (val) {
      pickerSelected.value = true
      localBg.value = val
      bgText.value = val
    }
  }
)
watch(localFg, (val) => {
  fgText.value = val
})
watch(localBg, (val) => {
  bgText.value = val
})

function normalizeHex(input: string): string | null {
  const s = input.trim().replace(/^#+/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`.toLowerCase()
  return null
}

function handleFgInput(val: string) {
  fgText.value = val
  const hex = normalizeHex(val)
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
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number | null {
  const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

const ratio = computed(() => {
  const l1 = luminance(localFg.value)
  const l2 = luminance(localBg.value)
  if (l1 === null || l2 === null) return null
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
})

const ratioLabel = computed(() => (ratio.value !== null ? ratio.value.toFixed(2) + ':1' : '—'))

const passAA = computed(() => (ratio.value ?? 0) >= 4.5)
const passAAA = computed(() => (ratio.value ?? 0) >= 7)
const passAALarge = computed(() => (ratio.value ?? 0) >= 3)
const passAAALarge = computed(() => (ratio.value ?? 0) >= 4.5)

function getTextColor(hex: string): string {
  const l = luminance(hex)
  return l !== null && l > 0.179 ? '#000000' : '#ffffff'
}

const fgInputStyle = computed(() =>
  pickerSelected.value ? { backgroundColor: localFg.value, color: getTextColor(localFg.value) } : {}
)
const bgInputStyle = computed(() => ({
  backgroundColor: localBg.value,
  color: getTextColor(localBg.value)
}))

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

async function pickColor(target: 'fg' | 'bg') {
  if (!('EyeDropper' in window)) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await new (window as any).EyeDropper().open()
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
    // user cancelled
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
          <p class="text-sm">{{ t('contrast.normalText') }}: The quick brown fox</p>
          <p class="text-lg font-bold">{{ t('contrast.largeText') }}: Aa</p>
        </div>
      </div>

      <!-- Color inputs -->
      <div class="space-y-3 md:space-y-2 my-3 md:my-0 w-full">
        <label class="block text-sm font-medium text-muted mb-1">
          {{ t('contrast.foreground') }}
        </label>
        <div class="flex items-center gap-1">
          <input
            type="color"
            v-model="localFg"
            :title="t('contrast.foreground')"
            class="size-8 shrink-0 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
          />
          <UFieldGroup class="w-full">
            <UInput
              :model-value="fgText"
              @update:model-value="handleFgInput"
              :style="fgInputStyle"
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

        <!-- <UButton
          :aria-label="t('contrast.title')"
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left-right"
          :ui="{ base: 'shrink-0 mb-0.5' }"
          @click="swapColors"
        /> -->

        <label class="block text-sm font-medium text-muted mb-1">
          {{ t('contrast.background') }}
        </label>
        <div class="flex items-center gap-1">
          <input
            type="color"
            v-model="localBg"
            :title="t('contrast.background')"
            class="size-8 shrink-0 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
          />
          <UFieldGroup class="w-full">
            <UInput
              :model-value="bgText"
              @update:model-value="handleBgInput"
              :style="bgInputStyle"
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
