<script setup lang="ts">
import type { NuxtError } from '#app'
import { en as uiEn, nl as uiNl } from '@nuxt/ui/locale'

/**
 * Replaces Nuxt's default error template, which declares no language and uses
 * hard-coded colours that ignore the app's theme. Pages that throw an error
 * may pass `data.messageKey`, a translation key for the heading, so the HTTP
 * status message can stay plain ASCII while the heading follows the interface.
 */
const props = defineProps<{ error: NuxtError }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const head = useLocaleHead({ seo: true })
const uiLocale = computed(() => (locale.value === 'nl' ? uiNl : uiEn))

const isNotFound = computed(() => props.error.statusCode === 404)
const layout = computed(() => (route.path.startsWith('/share/') ? 'shared' : 'default'))

const messageKey = computed(() => {
  const data = props.error.data as { messageKey?: unknown } | undefined
  return typeof data?.messageKey === 'string' ? data.messageKey : undefined
})

const heading = computed(() => {
  if (messageKey.value) return t(messageKey.value)
  return isNotFound.value ? t('error.notFound') : t('error.generic')
})

const description = computed(() =>
  isNotFound.value ? t('error.notFoundDescription') : t('error.genericDescription')
)

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: () => head.value.htmlAttrs?.lang,
    dir: () => head.value.htmlAttrs?.dir
  }
})

useSeoMeta({
  title: () => `${heading.value} - WCAGify`
})

function goHome() {
  return clearError({ redirect: localePath('/') })
}
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLayout :name="layout">
      <div class="mx-auto max-w-prose py-24 text-center">
        <p class="text-sm font-semibold text-toned">
          {{ t('error.statusCode', { code: error.statusCode }) }}
        </p>
        <h1 class="mt-2 text-3xl font-semibold text-highlighted">{{ heading }}</h1>
        <p class="mt-4 text-toned">{{ description }}</p>
        <UButton
          class="mt-8"
          :to="localePath('/')"
          :label="t('error.goHome')"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          size="lg"
          @click.prevent="goHome"
        />
      </div>
    </NuxtLayout>
  </UApp>
</template>
