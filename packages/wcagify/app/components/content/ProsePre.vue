<script lang="ts">
import theme from '#build/ui/prose/pre'
</script>

<script setup lang="ts">
/**
 * Override of Nuxt UI's `ProsePre` (Nuxt Content resolves `components/content`
 * before the module's prose components).
 *
 * Differences from the stock component, all for accessibility:
 * - the copy button is always visible and the `pre` reserves room for it, so it
 *   never covers code at any width or zoom level (WCAG 1.4.4, 1.4.10, 1.4.13);
 * - a visually hidden `role="status"` region announces "Code copied" and the
 *   button is named "Copied" while the tick icon shows (WCAG 4.1.3, 1.1.1);
 * - the button and status region are left out of the printed report so nothing
 *   is painted over the code in the PDF (WCAG 1.4.3).
 */
import { computed, useTemplateRef } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useComponentProps } from '@nuxt/ui/composables/useComponentProps'
import { useLocale } from '@nuxt/ui/composables/useLocale'
import { tv } from '@nuxt/ui/utils/tv'
import type { ButtonProps } from '@nuxt/ui'

type Slot = 'root' | 'header' | 'filename' | 'icon' | 'copy' | 'base' | 'status'

defineOptions({ inheritAttrs: false })

const rawProps = defineProps<{
  icon?: string
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  hideHeader?: boolean
  meta?: string
  copy?: boolean | ButtonProps
  class?: unknown
  ui?: Partial<Record<Slot, string>>
}>()

type SlotFn = (slotProps?: { class?: unknown } & Record<string, unknown>) => string

const props = useComponentProps('prose.pre', rawProps) as typeof rawProps & {
  copy: boolean | ButtonProps
}
const { t: uiT } = useLocale()
const { t } = useI18n()
const { copy: copyToClipboard, copied } = useClipboard()
const appConfig = useAppConfig()
const baseRef = useTemplateRef<HTMLPreElement>('baseRef')

const showCopy = computed(() => props.copy !== false)
const hasHeader = computed(() => Boolean(props.filename) && !props.hideHeader)
const copyProps = computed(() => (typeof props.copy === 'object' ? props.copy : {}))

const classes = computed(
  () =>
    tv({
      extend: theme,
      slots: {
        // Always visible, since a control that only appears on hover both hides code and cannot be dismissed (1.4.13).
        // Hidden in print via print.css.
        copy: 'print:hidden lg:opacity-100',
        status: 'sr-only print:hidden'
      },
      variants: {
        // Without a filename header the button sits over the top-right corner of the code.
        // Reserve that corner: 11px offset + 28px button + gap.
        reserve: {
          true: { base: 'pe-12' }
        }
      },
      ...(appConfig.ui as { prose?: { pre?: object } }).prose?.pre
    } as Parameters<typeof tv>[0])({ reserve: showCopy.value && !hasHeader.value }) as Record<
      Slot | 'status',
      SlotFn
    >
)

const copyLabel = computed(() =>
  copied.value ? t('codeBlock.copiedLabel') : uiT('prose.pre.copy')
)

function copyCode() {
  const code = props.code ?? baseRef.value?.textContent ?? ''
  copyToClipboard(code)
}
</script>

<template>
  <div :class="classes.root({ class: [props.ui?.root], filename: hasHeader })">
    <div v-if="hasHeader" :class="classes.header({ class: props.ui?.header })">
      <ProseCodeIcon
        :icon="props.icon"
        :filename="props.filename"
        :class="classes.icon({ class: props.ui?.icon })"
      />

      <span :class="classes.filename({ class: props.ui?.filename })">{{ props.filename }}</span>
    </div>

    <template v-if="showCopy">
      <span role="status" :class="classes.status({ class: props.ui?.status })">{{
        copied ? t('codeBlock.copied') : ''
      }}</span>

      <UButton
        :icon="copied ? appConfig.ui.icons.copyCheck : appConfig.ui.icons.copy"
        color="neutral"
        variant="outline"
        size="sm"
        :aria-label="copyLabel"
        v-bind="copyProps"
        :class="classes.copy({ class: props.ui?.copy })"
        @click="copyCode"
      />
    </template>

    <pre
      ref="baseRef"
      :class="classes.base({ class: [props.ui?.base, props.class] })"
      v-bind="$attrs"
    ><slot /></pre>
  </div>
</template>
