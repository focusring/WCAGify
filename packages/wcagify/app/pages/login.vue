<script setup lang="ts">
definePageMeta({ layout: 'shared' })

const { t } = useI18n()
const route = useRoute()
const { status, refresh, login, isAuthenticated } = useAdminAuth()

const secret = ref('')
const error = ref(false)
const loading = ref(false)

await refresh()

if (isAuthenticated.value) {
  await navigateTo((route.query.redirect as string) || '/')
}

async function submit() {
  error.value = false
  loading.value = true
  try {
    await login(secret.value)
    secret.value = ''
    await navigateTo((route.query.redirect as string) || '/')
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

useSeoMeta({
  title: () => `${t('admin.loginTitle')} — WCAGify`,
  robots: 'noindex, nofollow'
})
</script>

<template>
  <main class="flex-1 flex items-center justify-center py-12 sm:py-16">
    <!-- Setup required (production, no secret configured) -->
    <div v-if="status && !status.configured && !status.dev" class="max-w-sm text-center">
      <UIcon name="i-lucide-shield-alert" class="size-12 text-muted" />
      <h1 class="mt-4 text-xl font-semibold text-gray-950 dark:text-white">
        {{ t('admin.setupRequired') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ t('admin.setupDescription') }}
      </p>
      <pre
        class="mt-4 rounded-lg bg-elevated border border-default p-3 text-xs text-left font-mono"
      >
WCAGIFY_ADMIN_SECRET=your-secret-here</pre
      >
    </div>

    <!-- Login form -->
    <div v-else-if="status && status.configured" class="max-w-sm w-full">
      <div class="text-center">
        <UIcon name="i-lucide-shield" class="size-12 text-muted" />
        <h1 class="mt-4 text-xl font-semibold text-gray-950 dark:text-white">
          {{ t('admin.loginTitle') }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {{ t('admin.loginDescription') }}
        </p>
      </div>
      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <label for="admin-secret" class="block text-xs text-muted">
          {{ t('admin.secret') }}
        </label>
        <UInput
          id="admin-secret"
          v-model="secret"
          type="password"
          :placeholder="t('admin.secret')"
          aria-required="true"
          autofocus
          required
        />
        <p v-if="error" role="alert" class="text-sm text-error">
          {{ t('admin.invalidSecret') }}
        </p>
        <UButton type="submit" :label="t('admin.signIn')" :loading="loading" block />
      </form>
    </div>
  </main>
</template>
