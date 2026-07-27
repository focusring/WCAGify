<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { useI18n } from '../../../composables/useI18n'
import { useSettings } from '../../../composables/useSettings'

const props = defineProps<NodeViewProps>()
const { t } = useI18n()
const { wcagifyUrl } = useSettings()

const file = ref<File>()
const loading = ref(false)
const errorMessage = ref('')

watch(file, async (newFile) => {
  if (!newFile) return

  loading.value = true
  errorMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('file', newFile)

    const baseUrl = wcagifyUrl.value.replace(/\/$/, '')
    const res = await fetch(`${baseUrl}/api/issues/upload`, {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(
        data.statusMessage || data.message || `${t('editor.imageUpload.failed')} (${res.status})`
      )
    }

    const { url } = await res.json()

    const pos = props.getPos()
    if (typeof pos !== 'number') return

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: `${baseUrl}${url}` })
      .run()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('editor.imageUpload.failed')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/*"
      :label="t('editor.imageUpload.label')"
      :description="t('editor.imageUpload.description')"
      :preview="false"
      class="min-h-48"
    >
      <template #leading>
        <UAvatar
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: [loading && 'animate-spin'] }"
        />
      </template>
    </UFileUpload>
    <p v-if="errorMessage" class="mt-1 text-sm text-error">{{ errorMessage }}</p>
  </NodeViewWrapper>
</template>
