import { nextTick, watch } from 'vue'
import type { Ref } from 'vue'

// USelectMenu's popup isn't rendered with role="dialog"/aria-modal, which breaks how Narrator announces it closing. Patches the internal focusScope element to carry both attributes while open.
export function useSelectMenuDialogPatch(
  wrapperRef: Ref<HTMLElement | undefined>,
  isOpen: Ref<boolean>
): void {
  function onTabKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') isOpen.value = false
  }

  watch(isOpen, async (open, _, onCleanup) => {
    if (open) {
      document.addEventListener('keydown', onTabKeydown)
      onCleanup(() => document.removeEventListener('keydown', onTabKeydown))
      await nextTick()
      const focusScope = wrapperRef.value?.querySelector<HTMLElement>('[data-slot="focusScope"]')
      if (focusScope) {
        focusScope.setAttribute('role', 'dialog')
        focusScope.setAttribute('aria-modal', 'true')
      }
    } else {
      document.removeEventListener('keydown', onTabKeydown)
      await nextTick()
      const focusScope = wrapperRef.value?.querySelector<HTMLElement>('[data-slot="focusScope"]')
      if (focusScope) {
        focusScope.removeAttribute('role')
        focusScope.removeAttribute('aria-modal')
      }
    }
  })
}
