<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

definePageMeta({ layout: 'shared' })

const route = useRoute()
const { t } = useI18n()
const token = route.params.token as string

const password = ref('')
const passwordError = ref(false)
const authenticated = ref(false)

const { data, error, refresh } = await useAsyncData(`share-${token}`, () =>
  $fetch(`/api/share/${token}`, {
    query: password.value ? { password: password.value } : undefined
  })
)

if (error.value && error.value.statusCode !== 401) {
  throw createError({ statusCode: 404, statusMessage: t('share.notFound') })
}

const passwordRequired = computed(
  () => data.value && 'passwordRequired' in data.value && data.value.passwordRequired === true
)

const report = computed(() => {
  const d = data.value as Record<string, unknown> | null
  if (!d || passwordRequired.value || !('report' in d)) return null
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
  try {
    await refresh()
    if (report.value) {
      authenticated.value = true
    }
  } catch {
    passwordError.value = true
  }
}

const isGeneratingPdf = ref(false)

async function downloadPdf() {
  isGeneratingPdf.value = true
  try {
    const response = await $fetch<Blob>(`/api/share/${token}/pdf`, {
      responseType: 'blob',
      query: password.value ? { password: password.value } : undefined
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
        autofocus
        required
      />
      <p v-if="passwordError" class="text-sm text-error">
        {{ t('share.passwordIncorrect') }}
      </p>
      <UButton type="submit" :label="t('share.unlock')" block />
    </form>
  </div>

  <ReportContent v-else-if="report" :report="report" :issues="issues">
    <template #actions>
      <UButton
        :label="t('report.downloadPdf')"
        icon="i-lucide-download"
        :loading="isGeneratingPdf"
        @click="downloadPdf"
      />
    </template>
  </ReportContent>
</template>
