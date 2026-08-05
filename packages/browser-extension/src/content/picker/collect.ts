import { getUniqueSelector } from '../unique-selector'
import {
  FIELD_SELECTOR,
  getBorderColors,
  getElementOwnColor,
  getIconColors,
  getTextColors
} from './color'
import { getElementGradient } from './gradient'
import { firstSolidBackgroundColor, getBackgroundInfo } from './background'
import { getMediaInfo } from './media'
import { iframeMedia, probeIframe } from './iframe'
import { hasHoverStyles } from './hover'
import { getAriaRole, isAccessibilityHidden } from './role'
import { getOutlineColor, getShadowColors } from './shadow'
import {
  boxCoverage,
  isHtmlTag,
  isSvgTag,
  sameColor,
  scanDescendants,
  tryParseColor
} from './css-utils'
import type { ElementInfo, Rgba } from './types'

// Roles worth surfacing as their own nested section: interactive widgets + media/indicators that carry visual values and that the picker often can't land on directly.
// Structural/landmark/text roles are excluded to avoid noise.
const SURFACEABLE_ROLES = new Set([
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'spinbutton',
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'option',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'tab',
  'treeitem',
  'img',
  'progressbar',
  'meter'
])

// Caps panel length. Counts unique sections only duplicates merge into a ×N count without consuming a slot.
const MAX_CHILD_SECTIONS = 20

// Caps detection compute, since duplicates don't consume section slots: at most this many children run the detectors.
const MAX_CHILD_DETECTIONS = 100

// The role to surface for a descendant, or '' to skip it. Reuses getAriaRole, plus one SVG case: an <image> embeds a raster → 'img'; a plain inline <svg> is an icon,
// so it's skipped (its colors show in the parent's Icon row), though an explicit role="img" still surfaces.
function surfaceableRole(el: Element): string {
  if (isSvgTag(el, 'image')) return 'img'
  const role = getAriaRole(el)
  return SURFACEABLE_ROLES.has(role) ? role : ''
}

// Concatenated text of the elements referenced by aria-labelledby. '' when the attribute is absent or resolves to nothing.
// Resolved within the element's own document (id refs don't cross documents); shadow-scoped refs are best-effort missed.
function labelledByText(el: Element): string {
  const ids = el.getAttribute('aria-labelledby')?.trim()
  if (!ids) return ''
  const doc = el.ownerDocument
  const parts: string[] = []
  for (const id of ids.split(/\s+/)) {
    const text = doc?.getElementById(id)?.textContent?.replace(/\s+/g, ' ').trim()
    if (text) parts.push(text)
  }
  return parts.join(' ')
}

// Text of the <label>(s) tied to a form control — both `<label for>` and a wrapping `<label>` — via the element's own `labels` list.
// '' for elements that aren't labelable (no `labels`). Plain property access, so it stays realm-safe for iframe-hosted controls.
function associatedLabelText(el: Element): string {
  const labels = (el as HTMLInputElement).labels
  if (!labels || labels.length === 0) return ''
  return [...labels]
    .map((label) => label.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean)
    .join(' ')
}

// A short label to distinguish same-role children, resolved roughly in accessible-name precedence:
// aria-label → aria-labelledby → associated <label> → title → alt → text content → placeholder (last resort, for inputs with no real name).
// '' when none apply, which the panel surfaces as "(no accessible name)".
function elementLabel(el: Element): string {
  const named =
    el.getAttribute('aria-label')?.trim() ||
    labelledByText(el) ||
    associatedLabelText(el) ||
    el.getAttribute('title')?.trim() ||
    el.getAttribute('alt')?.trim() ||
    el.textContent?.replace(/\s+/g, ' ').trim() ||
    el.getAttribute('placeholder')?.trim() ||
    ''
  return named.length > 40 ? `${named.slice(0, 40)}…` : named
}

// A form control's visual widget is usually the wrapper around it, not the control itself: the leading search icon, the
// affix, the focus ring all sit on or beside the wrapper, outside the <input>. A section anchored on the control alone
// can't report those, so they fall through to the ancestor's rows and read as unexplained values there.
// These constants bound the climb from the control to that wrapper.
const MAX_WRAPPER_CLIMB = 3
// Same threshold findFillingDescendant uses for "this covers the box": the wrapper must be essentially the control's own box.
const WRAPPER_COVERAGE = 0.9

const isFormField = (el: Element): boolean =>
  isHtmlTag(el, 'input') || isHtmlTag(el, 'textarea') || isHtmlTag(el, 'select')

// Text that belongs to `candidate` rather than to `inner` a label, a hint, a suffix. Its presence means the element is
// a form group, not a bare adornment wrapper, and promoting to it would pull that text into the control's section.
// A control's own value/placeholder is not a text node, so an <input> never trips this; <option> text sits inside `inner`.
function hasTextOutside(candidate: Element, inner: Element): boolean {
  const walker = document.createTreeWalker(candidate, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue
    if (!inner.contains(node)) return true
  }
  return false
}

// Whether `candidate` is the adornment wrapper for `inner`, i.e. safe to anchor `inner`'s section on.
// It must not be surfaceable itself (it would get its own section), must hold no second widget (that makes it a group,
// and the second widget's own section already reports its values), must carry no text of its own, and must be the
// control's box. The coverage test is skipped when neither box is measurable (no layout) the structural guards stand alone.
function isAdornmentWrapper(candidate: Element, inner: Element): boolean {
  if (surfaceableRole(candidate) !== '') return false
  let widgets = 0
  for (const el of candidate.querySelectorAll('*')) {
    if (surfaceableRole(el) !== '' && ++widgets > 1) return false
  }
  if (hasTextOutside(candidate, inner)) return false
  const rect = candidate.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return true
  return boxCoverage(inner, rect) >= WRAPPER_COVERAGE
}

// The element a surfaced section is anchored to: a form control's adornment wrapper when it has one, else the element
// itself. Never climbs past `root`, which keeps the anchor inside the subtree being inspected.
function sectionAnchor(el: Element, root: Element): Element {
  if (!isFormField(el)) return el
  let anchor = el
  for (let depth = 0; depth < MAX_WRAPPER_CLIMB; depth++) {
    const candidate = anchor.parentElement
    if (!candidate || !root.contains(candidate)) break
    if (!isAdornmentWrapper(candidate, anchor)) break
    anchor = candidate
  }
  return anchor
}

// Boundary of an element's own scope: a descendant surfaced as its own section reports its text/icon colors there, so
// the ancestor must not repeat them. Built from the same anchors the child scan uses, so the two can't disagree on what
// a section owns a control promoted to a wrapper hands its boundary to that wrapper and stops being one itself,
// because its values are now part of the wrapper's section.
function surfacedChildTest(el: Element): (child: Element) => boolean {
  const wrappers = new Set<Element>()
  const promoted = new Set<Element>()
  for (const field of el.querySelectorAll(FIELD_SELECTOR)) {
    if (surfaceableRole(field) === '') continue
    const anchor = sectionAnchor(field, el)
    if (anchor === field) continue
    wrappers.add(anchor)
    promoted.add(field)
  }
  return (child) => wrappers.has(child) || (surfaceableRole(child) !== '' && !promoted.has(child))
}

function isDisabled(el: Element): boolean {
  try {
    if (el.matches(':disabled')) return true
  } catch {
    /* :disabled unsupported here fall through */
  }
  return el.getAttribute('aria-disabled') === 'true'
}

// Runs every detector on one element. `role` defaults to the element's computed role but can be overridden (the child scan passes the surfaceable role, so e.g. an <svg> is labelled img).
// <iframe> is special-cased, see collectIframeInfo.
export function collectElementInfo(el: Element, role: string = getAriaRole(el)): ElementInfo {
  if (isHtmlTag(el, 'iframe')) return collectIframeInfo(el as HTMLIFrameElement, role)
  return buildElementInfo(el, role)
}

function selectorOf(el: Element): string {
  const sel = getUniqueSelector(el)
  return Array.isArray(sel) ? sel.join(' > ') : sel
}

function buildElementInfo(el: Element, role: string): ElementInfo {
  const style = getComputedStyle(el)
  const isSurfacedChild = surfacedChildTest(el)
  const scan = scanDescendants(el, style, isSurfacedChild)
  const shadow = getShadowColors(el, style)
  const text = getTextColors(el, isSurfacedChild)
  const icons = getIconColors(el, style, scan, isSurfacedChild)
  return {
    selector: selectorOf(el),
    role,
    ariaHidden: isAccessibilityHidden(el),
    disabled: isDisabled(el),
    label: elementLabel(el),
    hasHoverStyles: hasHoverStyles(el),
    textColors: text.colors,
    textColorSources: text.sources,
    iconColors: icons.colors,
    iconColorSources: icons.sources,
    elementColor: getElementOwnColor(el, style),
    elementGradient: getElementGradient(el, style, scan.clipTextBackgroundImages),
    background: getBackgroundInfo(el, style),
    borderColors: getBorderColors(el, style),
    ringColors: shadow.ring,
    boxShadowColors: shadow.boxShadow,
    outlineColor: getOutlineColor(el, style),
    media: getMediaInfo(el)
  }
}

// An <iframe> hosts its own document the host page can't style-inspect across the boundary.
// For a reachable same-origin frame with content, run the full suite on the inner content and present it under the iframe's identity (selector, aria-hidden and disabled stay the frame's).
// Empty/cross-origin/inaccessible frames report why via the media row and fall back to the frame element, whose own box is host-side and safe to read.
function collectIframeInfo(iframe: HTMLIFrameElement, role: string): ElementInfo {
  const probe = probeIframe(iframe)
  if (probe.state === 'content' && probe.innerRoot) {
    try {
      const inner = buildElementInfo(probe.innerRoot, getAriaRole(probe.innerRoot))
      return {
        ...inner,
        selector: selectorOf(iframe),
        ariaHidden: isAccessibilityHidden(iframe),
        disabled: isDisabled(iframe),
        label: elementLabel(iframe) || inner.label,
        hasHoverStyles: hasHoverStyles(iframe), // the frame's host-side hover; inner children carry their own flags
        media: iframeMedia('content')
      }
    } catch {
      // Reading into the inner document (getComputedStyle / DOM) was unexpectedly blocked.
      const info = buildElementInfo(iframe, role)
      info.media = iframeMedia('inaccessible')
      return info
    }
  }
  const info = buildElementInfo(iframe, role)
  info.media = iframeMedia(probe.state)
  return info
}

// Drops a child's solid background when it matches the surface the selected element already sits on, so child sections don't repeat the component's background (gradients/media/blur kept).
// Compared as resolved rgba, so #fff / white match.
function dedupeChildBackground(info: ElementInfo, reference: Rgba | null): void {
  const bg = info.background
  if (bg.gradient || bg.media || !bg.color) return
  const c = tryParseColor(bg.color)
  if (!c || c.a === 0 || (reference && sameColor(c, reference))) bg.color = ''
}

// The subtree to surface sections from: an iframe's inner document when reachable (its descendants are otherwise invisible to the picker), else the element itself.
// null for an unreadable iframe, which contributes no sections.
function childScanRoot(el: Element): Element | null {
  if (isHtmlTag(el, 'iframe')) return probeIframe(el as HTMLIFrameElement).innerRoot
  return el
}

// A control promoted to its adornment wrapper (see sectionAnchor): the values come from the wrapper, since that is the
// widget as painted, while the identity stays the control's the role, accessible name and selector all name the thing
// you would act on, not the div drawn around it.
function collectFieldSection(control: Element, wrapper: Element, role: string): ElementInfo {
  const info = buildElementInfo(wrapper, role)
  return {
    ...info,
    selector: selectorOf(control),
    ariaHidden: isAccessibilityHidden(control),
    disabled: isDisabled(control),
    label: elementLabel(control) || info.label,
    hasHoverStyles: info.hasHoverStyles || hasHoverStyles(control)
  }
}

// Identity of a section's detected values (all but selector, count and the presentational source labels):
// same key ⇒ interchangeable in the panel.
function sectionKey(info: ElementInfo): string {
  const {
    selector: _selector,
    count: _count,
    textColorSources: _textSources,
    iconColorSources: _iconSources,
    ...values
  } = info
  return JSON.stringify(values)
}

// Sections plus the source element behind each (parallel arrays, same order) so the panel can navigate into a child by index.
// Selectors can't serve as that address: shadow-DOM paths are per-boundary, and an iframe child's selector resolves only inside that frame.
// For a merged ×N group the element is the first occurrence.
export interface ChildSections {
  sections: ElementInfo[]
  elements: Element[]
}

// Surfaceable descendants of el in document order, capped; excludes el itself.
// Includes disabled/aria-hidden elements on purpose surfacing the otherwise-unreachable ones is the point.
// Children with identical detected values merge into one ×N section, so rows of identical widgets (pagination dots, star icons) don't flood the panel.
export function collectChildSections(el: Element): ChildSections {
  const root = childScanRoot(el)
  if (!root) return { sections: [], elements: [] }
  const reference = firstSolidBackgroundColor(root)
  const sections = new Map<string, ElementInfo>()
  const elements = new Map<string, Element>()
  let detections = 0
  for (const child of root.querySelectorAll('*')) {
    // One level deep: querySelectorAll doesn't cross documents, so a nested iframe's content stays unscanned.
    if (isHtmlTag(child, 'iframe')) continue
    const role = surfaceableRole(child)
    if (!role) continue
    if (++detections > MAX_CHILD_DETECTIONS) break
    try {
      // A form control reports the values of its adornment wrapper. When that wrapper is the scanned element itself,
      // there is no nested section to make — the panel's own rows already carry them.
      const anchor = sectionAnchor(child, root)
      if (anchor === root) continue
      const info =
        anchor === child
          ? collectElementInfo(child, role)
          : collectFieldSection(child, anchor, role)
      dedupeChildBackground(info, reference)
      const key = sectionKey(info)
      const existing = sections.get(key)
      // At the section cap, duplicates of listed sections still bump their count; new uniques are dropped.
      if (existing) existing.count = (existing.count ?? 1) + 1
      else if (sections.size < MAX_CHILD_SECTIONS) {
        sections.set(key, info)
        elements.set(key, child)
      }
    } catch {
      continue // a child in a cross-document (iframe) subtree that resisted inspection
    }
  }
  // Both maps take the same keys in the same order, so the two arrays stay index-aligned.
  return { sections: [...sections.values()], elements: [...elements.values()] }
}
