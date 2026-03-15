<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { useSettings } from '../../../composables/useSettings'

const props = defineProps<NodeViewProps>()
const { wcagifyUrl } = useSettings()

const file = ref<File | null>(null)
const loading = ref(false)
const error = ref('')

watch(file, async (newFile) => {
  if (!newFile) return

  loading.value = true
  error.value = ''

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
      throw new Error(data.statusMessage || data.message || `Upload failed (${res.status})`)
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
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Upload failed'
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
      label="Upload an image"
      description="SVG, PNG, JPG or GIF (max. 2MB)"
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
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </NodeViewWrapper>
</template>
