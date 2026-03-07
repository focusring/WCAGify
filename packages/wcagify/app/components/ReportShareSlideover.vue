<script setup lang="ts">
import type { Share } from '../../server/utils/shares'

const props = defineProps<{
  reportSlug: string
}>()

const open = defineModel<boolean>('open', { default: false })

const { t, locale } = useI18n()

const adminSecret = ref('')
const adminError = ref(false)
const adminAuthenticated = ref(false)

const {
  data: shares,
  error,
  refresh
} = await useAsyncData(
  `shares-${props.reportSlug}`,
  () => $fetch<Share[]>('/api/shares', { query: { reportSlug: props.reportSlug } }),
  { default: () => [], watch: [() => props.reportSlug] }
)

const needsAdminLogin = computed(() => error.value?.statusCode === 401 && !adminAuthenticated.value)

async function loginAdmin() {
  adminError.value = false
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { secret: adminSecret.value }
    })
    adminAuthenticated.value = true
    adminSecret.value = ''
    await refresh()
  } catch {
    adminError.value = true
  }
}

const expiresAt = ref('')
const password = ref('')
const copiedToken = ref<string | undefined>()
const shareError = ref(false)

async function createShareLink() {
  shareError.value = false
  try {
    await $fetch('/api/shares', {
      method: 'POST',
      body: {
        reportSlug: props.reportSlug,
        expiresAt: expiresAt.value || undefined,
        password: password.value || undefined
      }
    })
    expiresAt.value = ''
    password.value = ''
    await refresh()
  } catch {
    shareError.value = true
  }
}

async function deleteShareLink(token: string, deleteToken: string) {
  shareError.value = false
  try {
    await $fetch(`/api/shares/${token}`, {
      method: 'DELETE',
      body: { deleteToken }
    })
    await refresh()
  } catch {
    shareError.value = true
  }
}

function shareUrl(token: string): string {
  return `${globalThis.location.origin}/share/${token}`
}

async function copyLink(token: string) {
  await navigator.clipboard.writeText(shareUrl(token))
  copiedToken.value = token
  setTimeout(() => {
    copiedToken.value = undefined
  }, 2000)
}

function formatDate(dateStr: string): string {
  const parsed = Date.parse(dateStr)
  if (Number.isNaN(parsed)) return dateStr
  return new Date(parsed).toLocaleDateString(locale.value)
}
</script>

<template>
  <USlideover v-model:open="open" :title="t('share.shareReport')" :modal="true">
    <template #body>
      <div v-if="needsAdminLogin" class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-shield" class="size-12 text-muted" />
        <h3 class="mt-4 text-lg font-semibold text-gray-950 dark:text-white">
          {{ t('share.adminRequired') }}
        </h3>
        <p class="mt-2 text-sm text-muted text-center">
          {{ t('share.adminDescription') }}
        </p>
        <form class="mt-6 w-full max-w-xs space-y-4" @submit.prevent="loginAdmin">
          <UInput
            v-model="adminSecret"
            type="password"
            :placeholder="t('share.adminSecret')"
            autofocus
            required
          />
          <p v-if="adminError" class="text-sm text-error">
            {{ t('share.adminError') }}
          </p>
          <UButton type="submit" :label="t('share.adminLogin')" block />
        </form>
      </div>

      <div v-else class="space-y-6">
        <div>
          <h3 class="text-sm font-medium text-gray-950 dark:text-white">
            {{ t('share.createLink') }}
          </h3>
          <div class="mt-3 space-y-3">
            <div>
              <label for="share-expires-at" class="text-xs text-muted">{{ t('share.expiresAt') }}</label>
              <UInput
                id="share-expires-at"
                v-model="expiresAt"
                type="date"
                :placeholder="t('share.noExpiry')"
                class="mt-1"
              />
            </div>
            <div>
              <label for="share-password" class="text-xs text-muted">{{ t('share.password') }}</label>
              <UInput
                id="share-password"
                v-model="password"
                type="password"
                :placeholder="t('share.passwordOptional')"
                class="mt-1"
              />
            </div>
            <p v-if="shareError" class="text-sm text-error">
              {{ t('share.error') }}
            </p>
            <UButton :label="t('share.createLink')" icon="i-lucide-plus" @click="createShareLink" />
          </div>
        </div>

        <USeparator />

        <div>
          <h3 class="text-sm font-medium text-gray-950 dark:text-white">
            {{ t('share.activeLinks') }}
          </h3>

          <p v-if="!shares?.length" class="mt-3 text-sm text-muted">
            {{ t('share.noLinks') }}
          </p>

          <ul v-else class="mt-3 space-y-3">
            <li
              v-for="share in shares"
              :key="share.token"
              class="rounded-lg border border-default p-3"
            >
              <div class="flex items-center gap-2">
                <UInput
                  :model-value="shareUrl(share.token)"
                  readonly
                  class="flex-1"
                  @focus="($event.target as HTMLInputElement).select()"
                />
                <UButton
                  :icon="copiedToken === share.token ? 'i-lucide-check' : 'i-lucide-copy'"
                  :label="copiedToken === share.token ? t('share.copied') : t('share.copyLink')"
                  variant="outline"
                  size="sm"
                  @click="copyLink(share.token)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  :aria-label="t('share.deleteLink')"
                  @click="deleteShareLink(share.token, share.delete_token)"
                />
              </div>
              <div class="mt-2 flex items-center gap-4 text-xs text-muted">
                <span>{{ t('share.createdAt') }}: {{ formatDate(share.created_at) }}</span>
                <span v-if="share.expires_at">
                  {{ t('share.expiresAt') }}: {{ formatDate(share.expires_at) }}
                </span>
                <UIcon
                  v-if="share.password_hash"
                  name="i-lucide-lock"
                  class="size-3"
                  :aria-label="t('share.passwordProtected')"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </USlideover>
</template>
