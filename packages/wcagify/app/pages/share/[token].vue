<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

definePageMeta({ layout: 'shared' })

const route = useRoute()
const { t } = useI18n()
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
    throw createError({ statusCode: 404, statusMessage: t('share.notFound') })
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

useSeoMeta({
  title: () => (report.value ? `${report.value.title} - WCAGify` : 'WCAGify'),
  robots: 'noindex, nofollow'
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

const isGeneratingPdf = ref(false)

async function downloadPdf() {
  isGeneratingPdf.value = true
  try {
    const response = await $fetch<Blob>(`/api/share/${token}/pdf`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(response)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.value?.title ?? 'report'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } finally {
    isGeneratingPdf.value = false
  }
}

function downloadEarl() {
  const link = document.createElement('a')
  link.href = `/api/exports/share/${token}`
  link.download = `${report.value?.title ?? 'report'}-evaluation.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div v-if="passwordRequired && !authenticated" class="mx-auto max-w-sm mt-24">
    <div class="text-center">
      <UIcon name="i-lucide-lock" class="size-12 text-muted" />
      <h1 class="mt-4 text-xl font-semibold text-gray-950 dark:text-white">
        {{ t('share.passwordRequired') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ t('share.passwordDescription') }}
      </p>
    </div>

    <form class="mt-6 space-y-4" @submit.prevent="submitPassword">
      <UInput
        v-model="password"
        type="password"
        :placeholder="t('share.password')"
        :aria-label="t('share.password')"
        :aria-describedby="passwordError ? 'password-error' : undefined"
        autofocus
        required
      />
      <p v-if="passwordError" id="password-error" role="alert" class="text-sm text-error">
        {{ t('share.passwordIncorrect') }}
      </p>
      <p v-if="submitError" role="alert" class="text-sm text-error">
        {{ t('share.error') }}
      </p>
      <UButton type="submit" :label="t('share.unlock')" block />
    </form>
  </div>

  <ReportContent v-else-if="report" :report="report" :issues="issues">
    <template #actions>
      <UButton
        :label="t('report.exportEarl')"
        icon="i-lucide-file-json"
        variant="outline"
        @click="downloadEarl"
      />
      <UButton
        :label="t('report.downloadPdf')"
        icon="i-lucide-download"
        :loading="isGeneratingPdf"
        @click="downloadPdf"
      />
    </template>
  </ReportContent>
</template>
