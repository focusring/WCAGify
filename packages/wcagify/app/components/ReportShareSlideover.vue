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
const creating = ref(false)

/**
 * The date picker gives a calendar date in the viewer's time zone; the link
 * stays valid until the end of that day there, not until midnight UTC.
 */
function endOfLocalDay(date: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date || undefined
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year!, month! - 1, day!, 23, 59, 59, 999).toISOString()
}

async function createShareLink() {
  // Keep the button focusable while the request runs (aria-disabled, not disabled).
  if (creating.value) return
  creating.value = true
  shareError.value = false
  try {
    await $fetch('/api/shares', {
      method: 'POST',
      body: {
        reportSlug: props.reportSlug,
        expiresAt: endOfLocalDay(expiresAt.value),
        password: password.value || undefined
      }
    })
    expiresAt.value = ''
    password.value = ''
    await refresh()
  } catch {
    shareError.value = true
  } finally {
    creating.value = false
  }
}

// Deleting a link cuts off everyone who has it, so it is confirmed in a dialog first.
const deleteCandidate = ref<Share | undefined>()
const deleting = ref(false)
const deleted = ref(false)
const cancelButton = useTemplateRef('cancelButton')
const activeLinksHeading = useTemplateRef('activeLinksHeading')

const confirmOpen = computed({
  get: () => deleteCandidate.value !== undefined,
  set: (value: boolean) => {
    if (!value) deleteCandidate.value = undefined
  }
})

function askDelete(share: Share) {
  deleted.value = false
  deleteCandidate.value = share
}

function focusCancelButton(event: Event) {
  event.preventDefault()
  cancelButton.value?.$el?.focus()
}

/** After a deletion the Delete button that opened the dialog is gone; land on the list instead. */
function restoreFocusAfterConfirm(event: Event) {
  if (!deleted.value) return
  event.preventDefault()
  activeLinksHeading.value?.focus()
}

async function confirmDelete() {
  const share = deleteCandidate.value
  if (!share || deleting.value) return
  deleting.value = true
  shareError.value = false
  try {
    await $fetch(`/api/shares/${share.token}`, {
      method: 'DELETE',
      body: { deleteToken: share.delete_token }
    })
    await refresh()
    deleted.value = true
  } catch {
    shareError.value = true
  } finally {
    deleting.value = false
    deleteCandidate.value = undefined
  }
}

/**
 * Reka UI dismisses a dialog on `pointerdown` outside it, so a press beside
 * the panel closes it before the button is released and the entered form
 * values are lost. Prevent that dismissal and close from a completed `click`
 * on the overlay instead (Escape and the close button keep working).
 * Reka emits the event only for the top-most layer, so a press that closes a
 * nested dialog or listbox does not arm the panel.
 */
let pressedOutside = false

function onPointerDownOutside(event: Event) {
  event.preventDefault()
  pressedOutside = true
}

function onDocumentClick(event: MouseEvent) {
  // The click target is the overlay only when press and release both landed on it.
  const onOverlay = (event.target as Element | null)?.matches('[data-slot="overlay"]') ?? false
  // On touch, Reka reports the press during this same click event, after this listener.
  setTimeout(() => {
    if (pressedOutside && onOverlay && open.value) open.value = false
    pressedOutside = false
  }, 0)
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

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
  <USlideover
    v-model:open="open"
    :title="t('share.shareReport')"
    :modal="true"
    :content="{ onPointerDownOutside }"
  >
    <template #body>
      <!-- Live region present from the start; "Copied!" on the button alone is not announced reliably. -->
      <p role="status" class="sr-only">{{ copiedToken ? t('share.linkCopied') : '' }}</p>

      <div v-if="needsAdminLogin" class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-shield" class="size-12 text-toned" />
        <h3 class="mt-4 font-semibold!">
          {{ t('share.adminRequired') }}
        </h3>
        <p class="mt-2 text-sm text-toned text-center">
          {{ t('share.adminDescription') }}
        </p>
        <form class="mt-6 w-full max-w-xs space-y-4" @submit.prevent="loginAdmin">
          <UFormField
            :label="t('share.adminSecret')"
            orientation="vertical"
            name="admin-secret"
            :ui="{ label: 'text-sm label-title' }"
          >
            <UInput
              id="admin-secret"
              v-model="adminSecret"
              type="password"
              :placeholder="t('share.adminSecret')"
              aria-required="true"
              autofocus
              required
            />
          </UFormField>
          <p role="alert" class="text-sm text-error">
            {{ adminError ? t('share.adminError') : '' }}
          </p>
          <UButton type="submit" :label="t('share.adminLogin')" block />
        </form>
      </div>

      <div v-else class="space-y-6">
        <h3 class="text-sm! mb-3">
          {{ t('share.createLink') }}
        </h3>
        <div class="space-y-3">
          <UFormField
            :label="t('share.expiresAt')"
            name="share-expiry-date"
            orientation="vertical"
            :ui="{ label: 'text-sm label-title' }"
          >
            <UInput
              id="share-expires-at"
              v-model="expiresAt"
              type="date"
              :placeholder="t('share.noExpiry')"
              class="mt-1"
            />
          </UFormField>

          <UFormField
            :label="t('share.password')"
            name="share-password"
            orientation="vertical"
            :ui="{ label: 'text-sm label-title' }"
          >
            <UInput id="share-password" v-model="password" type="password" class="mt-1" />
          </UFormField>
          <p role="alert" class="text-sm text-error">
            {{ shareError ? t('share.error') : '' }}
          </p>
          <UButton
            :label="t('share.createLink')"
            :icon="creating ? 'i-lucide-loader-circle' : 'i-lucide-plus'"
            :ui="{ leadingIcon: creating ? 'animate-spin' : undefined }"
            :aria-disabled="creating ? 'true' : undefined"
            :aria-busy="creating ? 'true' : undefined"
            class="aria-disabled:opacity-75 aria-disabled:cursor-not-allowed"
            @click="createShareLink"
          />
        </div>

        <USeparator aria-hidden="true" />

        <h3 ref="activeLinksHeading" tabindex="-1" class="text-sm! mb-3">
          {{ t('share.activeLinks') }}
        </h3>

        <p v-if="!shares?.length" class="mt-3 text-sm text-toned">
          {{ t('share.noLinks') }}
        </p>

        <ul v-else class="space-y-3">
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
                :aria-label="t('share.linkField', { date: formatDate(share.created_at) })"
                @focus="($event.target as HTMLInputElement).select()"
              />
              <UButton
                :icon="copiedToken === share.token ? 'i-lucide-check' : 'i-lucide-copy'"
                :label="copiedToken === share.token ? t('share.copied') : t('share.copyLink')"
                variant="outline"
                @click="copyLink(share.token)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                class="text-error-800 dark:text-error-500"
                :aria-label="t('share.deleteLink')"
                @click="askDelete(share)"
              />
            </div>
            <div class="mt-2 flex items-center gap-4 text-sm text-toned">
              <span>{{ t('share.createdAt') }}: {{ formatDate(share.created_at) }}</span>
              <span v-if="share.expires_at">
                {{ t('share.expiresAt') }}: {{ formatDate(share.expires_at) }}
              </span>
              <!-- The icon is aria-hidden by Nuxt Icon; the text next to it names it. -->
              <span v-if="share.passwordProtected" class="flex items-center">
                <UIcon name="i-lucide-lock" class="size-4 text-primary-800 dark:text-primary-400" />
                <span class="sr-only">{{ t('share.passwordProtected') }}</span>
              </span>
            </div>
          </li>
        </ul>
      </div>

      <UModal
        v-model:open="confirmOpen"
        :title="t('share.deleteConfirmTitle')"
        :description="
          deleteCandidate
            ? t('share.deleteConfirmText', { date: formatDate(deleteCandidate.created_at) })
            : ''
        "
        :content="{
          onOpenAutoFocus: focusCancelButton,
          onCloseAutoFocus: restoreFocusAfterConfirm
        }"
      >
        <template #footer>
          <div class="flex w-full flex-wrap justify-end gap-2">
            <UButton
              ref="cancelButton"
              :label="t('share.cancel')"
              color="neutral"
              variant="outline"
              @click="confirmOpen = false"
            />
            <UButton
              :label="t('share.deleteLink')"
              icon="i-lucide-trash-2"
              color="error"
              :aria-disabled="deleting ? 'true' : undefined"
              :aria-busy="deleting ? 'true' : undefined"
              class="aria-disabled:opacity-75 aria-disabled:cursor-not-allowed"
              @click="confirmDelete"
            />
          </div>
        </template>
      </UModal>
    </template>
  </USlideover>
</template>
