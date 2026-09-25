<script setup lang="ts">
definePageMeta({ layout: 'shared' })

const { t } = useI18n()
const route = useRoute()
const { status, refresh, login, isAuthenticated } = useAdminAuth()

const secret = ref('')
const error = ref(false)
const loading = ref(false)

/** The page asked for before signing in; only paths on this site, never another origin. */
const redirectTo = computed(() => {
  const { redirect } = route.query
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || /^\/[/\\]/.test(redirect)) {
    return '/'
  }
  return redirect === '/login' || redirect.startsWith('/login?') ? '/' : redirect
})

await refresh()

if (isAuthenticated.value) {
  await navigateTo(redirectTo.value)
}

async function submit() {
  // The button stays focusable while busy (aria-disabled), so ignore repeat submits.
  if (loading.value) return
  error.value = false
  loading.value = true
  try {
    await login(secret.value)
    secret.value = ''
    await navigateTo(redirectTo.value)
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
  <div class="flex-1 flex items-center justify-center py-12 sm:py-16">
    <!-- Setup required (production, no secret configured) -->
    <div v-if="status && !status.configured && !status.dev" class="max-w-sm text-center">
      <UIcon name="i-lucide-shield-alert" class="size-12 text-toned" />
      <h1 class="mt-4 text-xl font-semibold text-highlighted">
        {{ t('admin.setupRequired') }}
      </h1>
      <p class="mt-2 text-sm text-toned">
        {{ t('admin.setupDescription') }}
      </p>
      <pre
        class="mt-4 rounded-lg bg-elevated border border-default p-3 text-sm text-left font-mono"
      >
WCAGIFY_ADMIN_SECRET=your-secret-here</pre>
    </div>

    <!-- Login form -->
    <div v-else-if="status && status.configured" class="max-w-sm w-full">
      <div class="text-center">
        <UIcon name="i-lucide-shield" class="size-12 text-toned" />
        <h1 class="mt-4 text-xl font-semibold text-highlighted">
          {{ t('admin.loginTitle') }}
        </h1>
        <p class="mt-2 text-sm text-toned">
          {{ t('admin.loginDescription') }}
        </p>
      </div>
      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <label for="admin-secret" class="block text-sm text-toned">
          {{ t('admin.secret') }}
        </label>
        <UInput
          id="admin-secret"
          v-model="secret"
          type="password"
          autocomplete="current-password"
          :placeholder="t('admin.secret')"
          aria-required="true"
          autofocus
          required
        />
        <div>
          <!-- Always in the DOM so the live region exists before the message is written into it. -->
          <p id="login-error" role="alert" class="text-sm text-error" :class="{ 'mb-4': error }">
            {{ error ? t('admin.invalidSecret') : '' }}
          </p>
          <!-- Not `disabled`/`loading` while submitting: a disabled button drops focus to the page. -->
          <UButton
            type="submit"
            :label="t('admin.signIn')"
            :icon="loading ? 'i-lucide-loader-circle' : undefined"
            :ui="{ leadingIcon: 'animate-spin' }"
            :aria-disabled="loading || undefined"
            :aria-busy="loading || undefined"
            block
          />
        </div>
      </form>
    </div>
  </div>
</template>
