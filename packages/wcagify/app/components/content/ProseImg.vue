<script setup lang="ts">
/*
 * Replaces Nuxt UI's prose image, whose click-to-zoom put `type="button"` and
 * `aria-haspopup` on the `img` itself and could only be opened with a mouse.
 * The image sits in a real button that opens the enlarged view as a modal
 * dialog (focus moves in and returns to the button on close). The PDF gets a
 * plain image: the button is hidden in print and a print-only copy is shown.
 */
const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    width?: string | number
    height?: string | number
  }>(),
  { alt: '', width: undefined, height: undefined }
)

const { t } = useI18n()
const { baseURL } = useRuntimeConfig().app

const open = ref(false)

const refinedSrc = computed(() => {
  if (props.src.startsWith('/') && !props.src.startsWith('//')) {
    return `${baseURL.replace(/\/$/, '')}${props.src}`
  }
  return props.src
})

const buttonLabel = computed(() =>
  props.alt ? t('report.enlargeImageNamed', { alt: props.alt }) : t('report.enlargeImage')
)
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('report.enlargedImage')"
    :description="alt"
    :ui="{
      content: 'sm:max-w-[min(95vw,80rem)]',
      description: 'sr-only',
      body: 'flex items-center justify-center'
    }"
  >
    <button
      type="button"
      class="block w-full cursor-zoom-in rounded-md print:hidden"
      :aria-label="buttonLabel"
    >
      <img :src="refinedSrc" :alt="alt" :width="width" :height="height" class="w-full rounded-md" />
    </button>

    <template #body>
      <img
        :src="refinedSrc"
        :alt="alt"
        class="max-h-[80vh] w-auto max-w-full object-contain rounded-md"
      />
    </template>
  </UModal>

  <img
    :src="refinedSrc"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    class="hidden print:block w-full rounded-md"
  />
</template>
