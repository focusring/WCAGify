// Alt+arrow up/down move the picker's info bar to the top/bottom of the page, so it can be moved off content it would hide (e.g. a short footer).
// Alt is required so bare arrow keys keep scrolling the page while the picker is live.
// Shared by the page and the side panel, since keyboard focus can be in either while picking.
// Declined when the key belongs to a text field, or a control already handled it (e.g. a select opening on ArrowDown).
export function isPanelMoveKey(e: KeyboardEvent): boolean {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return false
  if (!e.altKey || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return false
  const target = e.target as HTMLElement | null
  if (target?.isContentEditable) return false
  return !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
}
