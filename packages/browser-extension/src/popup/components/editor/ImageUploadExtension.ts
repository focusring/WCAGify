import { Node, mergeAttributes } from '@tiptap/core'
import type { CommandProps, NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageUploadNodeComponent from './ImageUploadNode.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      insertImageUpload: () => ReturnType
    }
  }
}

const ImageUpload = Node.create({
  name: 'imageUpload',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {}
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-upload"]'
      }
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })]
  },
  addNodeView(): NodeViewRenderer {
    // eslint-disable-next-line new-cap -- VueNodeViewRenderer is a factory from @tiptap/vue-3
    return VueNodeViewRenderer(ImageUploadNodeComponent)
  },
  addCommands() {
    return {
      insertImageUpload:
        () =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name })
    }
  }
})

export { ImageUpload }
