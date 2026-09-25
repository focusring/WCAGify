<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

definePageMeta({ layout: 'shared' })

const route = useRoute()
const { t, locale, locales } = useI18n()
const token = route.params.token as string

const password = ref('')
const passwordError = ref(false)
const submitError = ref(false)
const authenticated = ref(false)

const { data, error, refresh } = await useAsyncData(`share-${token}`, () =>
  $fetch(`/api/share/${token}`)
)

if (error.value) {
  if (error.value.statusCode === 404) {
    throw createError({
      statusCode: 404,
      statusMessage: t('share.notFound'),
      data: { messageKey: 'share.notFound' }
    })
  }
  if (error.value.statusCode !== 401) {
    throw createError({
      statusCode: error.value.statusCode,
      statusMessage: error.value.statusMessage
    })
  }
}

const passwordRequired = computed(
  () => data.value && 'passwordRequired' in data.value && data.value.passwordRequired === true
)

const report = computed(() => {
  const d = data.value as Record<string, unknown> | null
  if (!d || passwordRequired.value || !('report' in d)) return undefined
  return d.report as unknown as ReportsCollectionItem
})

const issues = computed(() => {
  const d = data.value as Record<string, unknown> | null
  if (!d || passwordRequired.value || !('issues' in d)) return []
  return d.issues as unknown as IssuesCollectionItem[]
})

if (report.value) {
  authenticated.value = true
}

// Once shown, the report is the main content, so the document language is its own.
// The password prompt stays in the interface language.
const interfaceHead = useLocaleHead()
const documentLanguage = computed(() => {
  const code = report.value?.language
  if (!code) return interfaceHead.value.htmlAttrs?.lang
  return locales.value.find((entry) => entry.code === code)?.language ?? code
})

useHead({ htmlAttrs: { lang: documentLanguage } })

// The report title is not known before unlocking, so the prompt gets its own title.
useSeoMeta({
  title: () => {
    if (report.value) return `${report.value.title} - WCAGify`
    if (passwordRequired.value && !authenticated.value) {
      return `${t('share.passwordRequired')} - WCAGify`
    }
    return 'WCAGify'
  },
  robots: 'noindex, nofollow'
})

const passwordErrorMessage = computed(() => {
  if (passwordError.value) return t('share.passwordIncorrect')
  if (submitError.value) return t('share.error')
  return ''
})

async function submitPassword() {
  passwordError.value = false
  submitError.value = false
  try {
    await $fetch(`/api/share/${token}`, {
      method: 'POST',
      body: { password: password.value }
    })
    await refresh()
    if (report.value) {
      authenticated.value = true
    }
  } catch (fetchError: unknown) {
    const status = (fetchError as { statusCode?: number }).statusCode
    if (status === 401) {
      passwordError.value = true
    } else {
      submitError.value = true
    }
  }
}

const { status: downloadStatus, download, buttonProps: downloadButtonProps } = useReportDownload()
const reportTitle = computed(() => report.value?.title ?? 'report')

function downloadPdf() {
  return download(`/api/share/${token}/pdf`, `${reportTitle.value}.pdf`, 'pdf')
}

function downloadEarl() {
  return download(`/api/share/${token}/jsonld`, `${reportTitle.value}-earl.jsonld`, 'earl')
}
</script>

<template>
  <div v-if="passwordRequired && !authenticated" class="mx-auto max-w-sm mt-24">
    <div class="text-center">
      <UIcon name="i-lucide-lock" class="size-12 text-toned" />
      <h1 class="mt-4 text-xl font-semibold text-highlighted">
        {{ t('share.passwordRequired') }}
      </h1>
      <p class="mt-2 text-sm text-toned">
        {{ t('share.passwordDescription') }}
      </p>
    </div>

    <form class="mt-6 space-y-4" @submit.prevent="submitPassword">
      <UInput
        v-model="password"
        type="password"
        :placeholder="t('share.password')"
        :aria-label="t('share.password')"
        :aria-describedby="passwordErrorMessage ? 'password-error' : undefined"
        autofocus
        required
      />
      <!-- Always rendered so the live region exists before an error is written into it. -->
      <p id="password-error" role="alert" class="text-sm text-error">
        {{ passwordErrorMessage }}
      </p>
      <UButton type="submit" :label="t('share.unlock')" block />
    </form>
  </div>

  <ReportContent v-else-if="report" :report="report" :issues="issues">
    <template #actions>
      <!-- Interface controls inside the report, which carries the report's language. -->
      <div class="w-full min-w-0" :lang="locale">
        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            :label="t('report.downloadEarl')"
            variant="outline"
            v-bind="downloadButtonProps('earl', 'i-lucide-file-json')"
            @click="downloadEarl"
          />
          <UButton
            :label="t('report.downloadPdf')"
            v-bind="downloadButtonProps('pdf', 'i-lucide-download')"
            @click="downloadPdf"
          />
        </div>
        <p role="status" class="sr-only">{{ downloadStatus }}</p>
      </div>
    </template>
  </ReportContent>
</template>
