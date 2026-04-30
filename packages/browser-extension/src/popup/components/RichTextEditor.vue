<script setup lang="ts">
import { computed } from 'vue'
import type { EditorToolbarItem, EditorSuggestionMenuItem, EditorCustomHandlers } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'
import { useI18n } from '../../composables/useI18n'
import { ImageUpload } from './editor/ImageUploadExtension'

const model = defineModel<string>({ default: '' })

defineProps<{
  placeholder?: string
  label?: string
  ariaDescribedby?: string
}>()

const { t } = useI18n()

const focusRingUi = {
  base: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
}

const customHandlers = {
  imageUpload: {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
    isActive: (editor: Editor) => editor.isActive('imageUpload'),
    isDisabled: undefined
  }
} satisfies EditorCustomHandlers

const fixedToolbarItems = computed<EditorToolbarItem<typeof customHandlers>[][]>(() =>
  [
    [
      { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: t('editor.undo') } },
      { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: t('editor.redo') } }
    ],
    [
      {
        icon: 'i-lucide-heading',
        tooltip: { text: t('editor.headings') },
        content: { align: 'start' },
        items: [
          { kind: 'heading', level: 6, icon: 'i-lucide-heading-6', label: t('editor.heading6') }
        ]
      },
      {
        icon: 'i-lucide-list',
        tooltip: { text: t('editor.lists') },
        content: { align: 'start' },
        items: [
          { kind: 'bulletList', icon: 'i-lucide-list', label: t('editor.bulletList') },
          { kind: 'orderedList', icon: 'i-lucide-list-ordered', label: t('editor.orderedList') }
        ]
      },
      {
        kind: 'blockquote',
        icon: 'i-lucide-text-quote',
        tooltip: { text: t('editor.blockquote') }
      },
      { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: t('editor.codeBlock') } }
    ],
    [
      { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: t('editor.bold') } },
      {
        kind: 'mark',
        mark: 'italic',
        icon: 'i-lucide-italic',
        tooltip: { text: t('editor.italic') }
      },
      {
        kind: 'mark',
        mark: 'underline',
        icon: 'i-lucide-underline',
        tooltip: { text: t('editor.underline') }
      },
      {
        kind: 'mark',
        mark: 'strike',
        icon: 'i-lucide-strikethrough',
        tooltip: { text: t('editor.strikethrough') }
      },
      { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: t('editor.code') } }
    ],
    [
      { kind: 'link', icon: 'i-lucide-link', tooltip: { text: t('editor.link') } },
      { kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: t('editor.image') } }
    ],
    [
      {
        kind: 'horizontalRule',
        icon: 'i-lucide-separator-horizontal',
        tooltip: { text: t('editor.horizontalRule') }
      }
    ]
  ].map((group) =>
    group.map((item: EditorToolbarItem<typeof customHandlers>) => ({ ...item, ui: focusRingUi }))
  )
)

const suggestionItems = computed(
  () =>
    [
      [
        { type: 'label' as const, label: t('editor.style') },
        { kind: 'paragraph' as const, label: t('editor.paragraph'), icon: 'i-lucide-type' },
        {
          kind: 'heading' as const,
          level: 6 as const,
          label: t('editor.heading6'),
          icon: 'i-lucide-heading-6'
        },
        { kind: 'bulletList' as const, label: t('editor.bulletList'), icon: 'i-lucide-list' },
        {
          kind: 'orderedList' as const,
          label: t('editor.numberedList'),
          icon: 'i-lucide-list-ordered'
        },
        { kind: 'blockquote' as const, label: t('editor.blockquote'), icon: 'i-lucide-text-quote' },
        { kind: 'codeBlock' as const, label: t('editor.codeBlock'), icon: 'i-lucide-square-code' }
      ],
      [
        { type: 'label' as const, label: t('editor.insert') },
        { kind: 'imageUpload' as const, label: t('editor.image'), icon: 'i-lucide-image' },
        {
          kind: 'horizontalRule' as const,
          label: t('editor.horizontalRule'),
          icon: 'i-lucide-separator-horizontal'
        }
      ]
    ] as EditorSuggestionMenuItem<typeof customHandlers>[][]
)
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    v-model="model"
    content-type="markdown"
    :extensions="[ImageUpload]"
    :handlers="customHandlers"
    :placeholder="placeholder"
    :aria-label="label"
    :aria-describedby="ariaDescribedby"
    :ui="{ base: 'px-3 py-2 min-h-32' }"
    class="bg-elevated hover:bg-accented/75 transition-colors duration-200 w-full rounded-md border input-border"
  >
    <UEditorToolbar
      :editor="editor"
      :items="fixedToolbarItems"
      :ui="{ separator: 'bg-slate-300 dark:bg-slate-700' }"
      class="editor-toolbar border-b input-border px-2 py-1 overflow-x-auto"
    />

    <UEditorDragHandle :editor="editor" />

    <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
  </UEditor>
</template>
