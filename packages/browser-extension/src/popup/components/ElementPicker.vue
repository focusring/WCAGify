<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()

const selector = ref('')
const pageUrl = ref('')
const pageTitle = ref('')
const picking = ref(false)

defineExpose({ selector, pageUrl, pageTitle })

function onMessage(message: { type: string; selector?: string; url?: string; pageTitle?: string }) {
  if (message.type === 'element-picked') {
    selector.value = message.selector ?? ''
    pageUrl.value = message.url ?? ''
    pageTitle.value = message.pageTitle ?? ''
    picking.value = false
  }
  if (message.type === 'picker-cancelled') {
    picking.value = false
  }
}

onMounted(() => chrome.runtime.onMessage.addListener(onMessage))
onUnmounted(() => chrome.runtime.onMessage.removeListener(onMessage))

async function pickElement() {
  // Side panel lives in the same window — find the active page tab directly
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs.find(
    (t) => t.url && !t.url.startsWith('chrome') && !t.url.startsWith('extension')
  )
  if (!tab?.id) return

  picking.value = true
  selector.value = ''
  pageUrl.value = ''
  pageTitle.value = ''

  chrome.tabs.sendMessage(tab.id, { type: 'start-picker' }).catch(() => {
    picking.value = false
  })
}
</script>

<template>
  <div class="space-y-2">
    <UButton
      @click="pickElement"
      :disabled="picking"
      variant="outline"
      class="w-full justify-center cursor-pointer"
      icon="i-lucide-square-mouse-pointer"
      size="xl"
      :ui="{ leadingIcon: 'size-5', base: 'cursor-pointer' }"
      :label="picking ? t('picker.picking') : t('picker.pickElement')"
    />

    <div v-if="selector" class="space-y-1 rounded bg-gray-50 dark:bg-gray-800 p-2 text-sm">
      <div>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ t('picker.selector') }}</span>
        <code class="ml-1 break-all text-gray-800 dark:text-gray-200">{{ selector }}</code>
      </div>
      <div>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ t('picker.url') }}</span>
        <span class="ml-1 break-all text-gray-800 dark:text-gray-200">{{ pageUrl }}</span>
      </div>
      <div>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ t('picker.page') }}</span>
        <span class="ml-1 text-gray-800 dark:text-gray-200">{{ pageTitle }}</span>
      </div>
    </div>
  </div>
</template>
