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

// Roles worth their own nested section: interactive widgets + visual indicators the picker often can't land on directly.
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

// Caps panel length; duplicates merge into a ×N count instead of consuming a slot.
const MAX_CHILD_SECTIONS = 20

// Caps detection compute: at most this many children run the detectors.
const MAX_CHILD_DETECTIONS = 100

// Role to surface for a descendant, or '' to skip it. An <image> embeds a raster → 'img'; a plain inline <svg> is an
// icon and skipped (its colors show in the Icon row) unless it has an explicit role="img".
function surfaceableRole(el: Element): string {
  if (isSvgTag(el, 'image')) return 'img'
  const role = getAriaRole(el)
  return SURFACEABLE_ROLES.has(role) ? role : ''
}

// Concatenated text of the aria-labelledby targets, resolved in the element's own document (id refs don't cross documents/shadow roots).
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

// Text of the <label>(s) tied to a form control, via its `labels` list ('' if not labelable). Plain property access,
// so it stays realm-safe for iframe-hosted controls.
function associatedLabelText(el: Element): string {
  const labels = (el as HTMLInputElement).labels
  if (!labels || labels.length === 0) return ''
  return [...labels]
    .map((label) => label.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean)
    .join(' ')
}

// Short label distinguishing same-role children, in roughly accessible-name precedence order.
// '' when none apply, shown by the panel as "(no accessible name)".
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

// A form control's visual widget (icon, affix, focus ring) is often painted on a wrapper around it, not the <input>
// itself. Anchoring the section on the control alone would miss those and leak them into the ancestor's rows instead.
const MAX_WRAPPER_CLIMB = 3
// Same "covers the box" threshold as findFillingDescendant.
const WRAPPER_COVERAGE = 0.9

const isFormField = (el: Element): boolean =>
  isHtmlTag(el, 'input') || isHtmlTag(el, 'textarea') || isHtmlTag(el, 'select')

// Text under `candidate` but outside `inner` (a label, hint, suffix) means this is a form group, not a bare
// adornment wrapper — promoting would leak that text into the control's section.
function hasTextOutside(candidate: Element, inner: Element): boolean {
  const walker = document.createTreeWalker(candidate, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue
    if (!inner.contains(node)) return true
  }
  return false
}

// Whether `candidate` is safe to anchor `inner`'s section on: not surfaceable itself, holds no second widget, carries
// no outside text, and is essentially `inner`'s own box (coverage check skipped when unmeasurable — the rest still applies).
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

// The element a surfaced section anchors to: a form control's adornment wrapper if it has one, else itself. Never climbs past `root`.
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

// Boundary test: a descendant surfaced as its own section already reports its colors there, so the ancestor must not
// repeat them. Uses the same anchors as the child scan, so a control promoted to its wrapper stops being its own boundary — the wrapper is.
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

// Runs every detector on one element. `role` defaults to the computed role, but the child scan can override it (e.g.
// labelling an <svg> as img). <iframe> is special-cased below.
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

// The picker doesn't reach into an iframe's document; it only inspects the frame element. The media row still reports
// reachability (from probeIframe) as an informational label.
function collectIframeInfo(iframe: HTMLIFrameElement, role: string): ElementInfo {
  const info = buildElementInfo(iframe, role)
  info.media = iframeMedia(probeIframe(iframe).state)
  return info
}

// Drops a child's solid background when it matches the element's own surface (gradients/media/blur kept); compared as
// resolved rgba, so #fff/white match.
function dedupeChildBackground(info: ElementInfo, reference: Rgba | null): void {
  const bg = info.background
  if (bg.gradient || bg.media || !bg.color) return
  const c = tryParseColor(bg.color)
  if (!c || c.a === 0 || (reference && sameColor(c, reference))) bg.color = ''
}

// A control promoted to its wrapper (see sectionAnchor): values come from the wrapper (the widget as painted), but
// identity stays the control's — role, name and selector should name the thing you'd act on, not the div around it.
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

// Identity of a section's detected values (excludes selector, count, and the source labels): same key ⇒ interchangeable.
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

// Sections + their source elements (parallel arrays), so the panel can navigate to a child by index — selectors alone
// can't address shadow-DOM children. A merged ×N group points to the first occurrence.
export interface ChildSections {
  sections: ElementInfo[]
  elements: Element[]
}

// Surfaceable descendants of el in document order, capped; excludes el itself. Disabled/aria-hidden elements are
// included on purpose — surfacing the otherwise-unreachable ones is the point. Identical children merge into one ×N section.
export function collectChildSections(el: Element): ChildSections {
  const reference = firstSolidBackgroundColor(el)
  const sections = new Map<string, ElementInfo>()
  const elements = new Map<string, Element>()
  let detections = 0
  for (const child of el.querySelectorAll('*')) {
    // One level deep: querySelectorAll doesn't cross documents, so a nested iframe's content stays unscanned.
    if (isHtmlTag(child, 'iframe')) continue
    const role = surfaceableRole(child)
    if (!role) continue
    if (++detections > MAX_CHILD_DETECTIONS) break
    try {
      // Skip a field whose wrapper is the scanned element itself — no nested section to make, el's own rows already carry it.
      const anchor = sectionAnchor(child, el)
      if (anchor === el) continue
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
      continue // inspection of this child failed unexpectedly; skip it
    }
  }
  // Both maps take the same keys in the same order, so the two arrays stay index-aligned.
  return { sections: [...sections.values()], elements: [...elements.values()] }
}
