<script setup lang="ts">
import type { Share } from '../../server/utils/shares'

const props = defineProps<{
  reportSlug: string
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

const { data: shares, refresh } = await useAsyncData(
  `shares-${props.reportSlug}`,
  () => $fetch<Share[]>('/api/shares', { query: { reportSlug: props.reportSlug } }),
  { default: () => [] }
)

const expiresAt = ref('')
const password = ref('')
const copiedToken = ref<string | null>(null)

async function createShareLink() {
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
}

async function deleteShareLink(token: string) {
  await $fetch(`/api/shares/${token}`, { method: 'DELETE' })
  await refresh()
}

function shareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`
}

async function copyLink(token: string) {
  await navigator.clipboard.writeText(shareUrl(token))
  copiedToken.value = token
  setTimeout(() => {
    copiedToken.value = null
  }, 2000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <USlideover v-model:open="open" :title="t('share.shareReport')" :modal="true">
    <template #body>
      <div class="space-y-6">
        <div>
          <h3 class="text-sm font-medium text-gray-950 dark:text-white">
            {{ t('share.createLink') }}
          </h3>
          <div class="mt-3 space-y-3">
            <div>
              <label class="text-xs text-muted">{{ t('share.expiresAt') }}</label>
              <UInput
                v-model="expiresAt"
                type="date"
                :placeholder="t('share.noExpiry')"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-xs text-muted">{{ t('share.password') }}</label>
              <UInput
                v-model="password"
                type="password"
                :placeholder="t('share.passwordOptional')"
                class="mt-1"
              />
            </div>
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
                  @click="deleteShareLink(share.token)"
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
