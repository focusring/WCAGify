// WAI-ARIA 1.2 roles (abstract roles excluded). Used to validate an explicit role token before trusting it.
const ARIA_ROLES = new Set([
  'alert',
  'alertdialog',
  'application',
  'article',
  'banner',
  'blockquote',
  'button',
  'caption',
  'cell',
  'checkbox',
  'code',
  'columnheader',
  'combobox',
  'complementary',
  'contentinfo',
  'definition',
  'deletion',
  'dialog',
  'directory',
  'document',
  'emphasis',
  'feed',
  'figure',
  'form',
  'generic',
  'grid',
  'gridcell',
  'group',
  'heading',
  'img',
  'insertion',
  'link',
  'list',
  'listbox',
  'listitem',
  'log',
  'main',
  'marquee',
  'math',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'meter',
  'navigation',
  'none',
  'note',
  'option',
  'paragraph',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'rowheader',
  'scrollbar',
  'search',
  'searchbox',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'strong',
  'subscript',
  'superscript',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'term',
  'textbox',
  'time',
  'timer',
  'toolbar',
  'tooltip',
  'tree',
  'treegrid',
  'treeitem'
])

// First valid token of the explicit `role` attribute (it's a space-separated fallback list; unknown tokens are
// skipped). '' when there is no role attribute or none of its tokens are real roles.
function explicitRole(el: Element): string {
  const attr = el.getAttribute('role')
  if (!attr) return ''
  for (const token of attr.trim().split(/\s+/)) {
    const role = token.toLowerCase()
    if (ARIA_ROLES.has(role)) return role
  }
  return ''
}

// True when an element carries a non-empty accessible name via the lightweight sources we can read synchronously.
// Used by elements whose implicit role only applies when named (section → region, form → form).
function hasAccessibleNameish(el: Element): boolean {
  return !!(
    el.getAttribute('aria-label')?.trim() ||
    el.getAttribute('aria-labelledby')?.trim() ||
    el.getAttribute('title')?.trim()
  )
}

// <input> implicit role by type (+ list attr). Types without a mapped role (color, date, file, password…) return ''.
function inputRole(input: HTMLInputElement): string {
  const type = (input.getAttribute('type') || 'text').toLowerCase()
  const hasList = input.hasAttribute('list')
  switch (type) {
    case 'button':
    case 'image':
    case 'reset':
    case 'submit':
      return 'button'
    case 'checkbox':
      return 'checkbox'
    case 'radio':
      return 'radio'
    case 'range':
      return 'slider'
    case 'number':
      return 'spinbutton'
    case 'search':
      return hasList ? 'combobox' : 'searchbox'
    case 'email':
    case 'tel':
    case 'text':
    case 'url':
      return hasList ? 'combobox' : 'textbox'
    default:
      return ''
  }
}

// header/footer map to banner/contentinfo only at the top level — scoped inside sectioning content they have no role.
function isScopedToSectioning(el: Element): boolean {
  return !!el.parentElement?.closest('article, aside, main, nav, section')
}

// Implicit ARIA role from the HTML-ARIA mapping. Covers the common, mostly non-contextual cases plus a few cheap
// context checks (a[href], input/select type, header/footer scoping, li/section/form). Best-effort: deep contextual
// rules (td/th in tables, li ancestry beyond the parent) are approximated. '' when the element has no semantic role.
function implicitRole(el: Element): string {
  const tag = el.localName
  switch (tag) {
    case 'a':
    case 'area':
      return el.hasAttribute('href') ? 'link' : ''
    case 'article':
      return 'article'
    case 'aside':
      return 'complementary'
    case 'button':
      return 'button'
    case 'datalist':
      return 'listbox'
    case 'dd':
      return 'definition'
    case 'details':
      return 'group'
    case 'dialog':
      return 'dialog'
    case 'dt':
      return 'term'
    case 'fieldset':
      return 'group'
    case 'figure':
      return 'figure'
    case 'footer':
      return isScopedToSectioning(el) ? '' : 'contentinfo'
    case 'form':
      return hasAccessibleNameish(el) ? 'form' : ''
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return 'heading'
    case 'header':
      return isScopedToSectioning(el) ? '' : 'banner'
    case 'hr':
      return 'separator'
    case 'html':
      return 'document'
    case 'img':
      return el.getAttribute('alt') === '' ? 'presentation' : 'img'
    case 'input':
      return inputRole(el as HTMLInputElement)
    case 'li':
      return el.parentElement && ['ul', 'ol', 'menu'].includes(el.parentElement.localName)
        ? 'listitem'
        : ''
    case 'main':
      return 'main'
    case 'math':
      return 'math'
    case 'menu':
    case 'ol':
    case 'ul':
      return 'list'
    case 'nav':
      return 'navigation'
    case 'optgroup':
      return 'group'
    case 'option':
      return 'option'
    case 'output':
      return 'status'
    case 'p':
      return 'paragraph'
    case 'progress':
      return 'progressbar'
    case 'section':
      return hasAccessibleNameish(el) ? 'region' : ''
    case 'select':
      return (el as HTMLSelectElement).multiple || (el as HTMLSelectElement).size > 1
        ? 'listbox'
        : 'combobox'
    case 'table':
      return 'table'
    case 'tbody':
    case 'tfoot':
    case 'thead':
      return 'rowgroup'
    case 'td':
      return 'cell'
    case 'textarea':
      return 'textbox'
    case 'th':
      return 'columnheader'
    case 'tr':
      return 'row'
    default:
      return ''
  }
}

// Presentational-roles conflict resolution: an explicit presentation/none role is ignored when the element is
// focusable or carries global ARIA state/properties, so it falls back to its implicit role.
function hasPresentationalConflict(el: Element): boolean {
  if ((el instanceof HTMLElement || el instanceof SVGElement) && el.tabIndex >= 0) return true
  for (const attr of el.attributes) {
    if (attr.name.startsWith('aria-') && attr.name !== 'aria-hidden') return true
  }
  return false
}

// The element's computed ARIA role: explicit role (after presentational-conflict resolution) wins over implicit.
// 'generic' and no-role both collapse to '' so the panel can hide the row for elements without useful semantics.
export function getAriaRole(el: Element): string {
  const explicit = explicitRole(el)
  const implicit = implicitRole(el)
  const resolved =
    (explicit === 'presentation' || explicit === 'none') && hasPresentationalConflict(el)
      ? implicit
      : explicit || implicit
  return resolved === 'generic' ? '' : resolved
}

// aria-hidden="true" or inert removes the element (and its subtree) from the accessibility tree. Reported as a flag so
// the panel can warn that a role, if present, isn't actually exposed to assistive tech.
export function isAccessibilityHidden(el: Element): boolean {
  return !!el.closest('[aria-hidden="true"], [inert]')
}
