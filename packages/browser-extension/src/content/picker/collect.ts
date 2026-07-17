import { getUniqueSelector } from '../unique-selector'
import { getBorderColors, getElementOwnColor, getIconColors, getTextColors } from './color'
import { getElementGradient } from './gradient'
import { firstSolidBackgroundColor, getBackgroundInfo } from './background'
import { getMediaInfo } from './media'
import { iframeMedia, probeIframe } from './iframe'
import { hasHoverStyles } from './hover'
import { getAriaRole, isAccessibilityHidden } from './role'
import { getOutlineColor, getShadowColors } from './shadow'
import { isHtmlTag, isSvgTag, sameColor, scanDescendants, tryParseColor } from './css-utils'
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

// Bounds the panel length for pathological subtrees (e.g. a toolbar with dozens of controls). Counts unique sections — duplicates merge into a ×N count and don't consume slots.
const MAX_CHILD_SECTIONS = 20

// Bounds detection compute now that duplicates don't count toward MAX_CHILD_SECTIONS: at most this many children run the full detector suite per scan.
const MAX_CHILD_DETECTIONS = 100

// The role to surface for a descendant, or '' to skip it. Reuses getAriaRole, with one SVG special case:
//   • An SVG <image> embeds a raster (like <img>) → surface as media 'img'.
//   • A plain inline <svg> is an icon, not media skipped (getAriaRole returns ''); its colors show in the parent's
//     Icon row. An explicit role="img" still surfaces.
function surfaceableRole(el: Element): string {
  if (isSvgTag(el, 'image')) return 'img'
  const role = getAriaRole(el)
  return SURFACEABLE_ROLES.has(role) ? role : ''
}

// A short label to distinguish same-role children: accessible name (aria-label/title/alt) or trimmed text content.
function elementLabel(el: Element): string {
  const named =
    el.getAttribute('aria-label')?.trim() ||
    el.getAttribute('title')?.trim() ||
    el.getAttribute('alt')?.trim() ||
    el.textContent?.replace(/\s+/g, ' ').trim() ||
    ''
  return named.length > 40 ? `${named.slice(0, 40)}…` : named
}

function isDisabled(el: Element): boolean {
  try {
    if (el.matches(':disabled')) return true
  } catch {
    /* :disabled unsupported here fall through */
  }
  return el.getAttribute('aria-disabled') === 'true'
}

// Runs every detector on one element. `role` defaults to the element's own computed role but can be overridden (the child scan passes the surfaceable role so e.g. an <svg> is labelled img).
// An <iframe> renders a separate document, handled specially so detection reaches the content inside it (see collectIframeInfo).
export function collectElementInfo(el: Element, role: string = getAriaRole(el)): ElementInfo {
  if (isHtmlTag(el, 'iframe')) return collectIframeInfo(el as HTMLIFrameElement, role)
  return buildElementInfo(el, role)
}

function buildElementInfo(el: Element, role: string): ElementInfo {
  const style = getComputedStyle(el)
  const scan = scanDescendants(el, style)
  const shadow = getShadowColors(el, style)
  const sel = getUniqueSelector(el)
  return {
    selector: Array.isArray(sel) ? sel.join(' > ') : sel,
    role,
    ariaHidden: isAccessibilityHidden(el),
    disabled: isDisabled(el),
    label: elementLabel(el),
    hasHoverStyles: hasHoverStyles(el),
    textColors: getTextColors(el),
    iconColors: getIconColors(el, style, scan.maskBackgroundColors),
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

// An <iframe> hosts its own document that the host page can't style-inspect through the frame boundary.
// For a reachable same-origin document with content, we run the full detection suite on that inner
// content (its real colors/text/background) and present it under the iframe's own identity — selector,
// aria-hidden and disabled stay the frame's. Empty/cross-origin/inaccessible frames only report why no
// inner values are available (via the media row); detection then falls back to the frame element itself,
// whose own box (border/background) is host-side and safe to read.
function collectIframeInfo(iframe: HTMLIFrameElement, role: string): ElementInfo {
  const probe = probeIframe(iframe)
  if (probe.state === 'content' && probe.innerRoot) {
    try {
      const inner = buildElementInfo(probe.innerRoot, getAriaRole(probe.innerRoot))
      const sel = getUniqueSelector(iframe)
      return {
        ...inner,
        selector: Array.isArray(sel) ? sel.join(' > ') : sel,
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

// The effective surface the selected element visually sits on: its own background, or the nearest ancestor's when transparent (first solid color from el upward, inclusive).
function effectiveBackgroundColor(el: Element): Rgba | null {
  return firstSolidBackgroundColor(el)
}

// Drops a child's solid background color when it matches the surface the selected element already sits on, so child sections don't repeat the component's background (gradients/media/blur kept).
// Compared as resolved rgba, so #fff / white / rgb(255,255,255) all match.
function dedupeChildBackground(info: ElementInfo, reference: Rgba | null): void {
  const bg = info.background
  if (bg.gradient || bg.media || !bg.color) return
  const c = tryParseColor(bg.color)
  if (!c || c.a === 0 || (reference && sameColor(c, reference))) bg.color = ''
}

// The subtree to surface nested sections from: an iframe's inner content document when reachable — its
// descendants are otherwise invisible to the picker — else the element itself. null for an iframe whose
// content can't be read (empty/cross-origin/inaccessible), so it contributes no child sections.
function childScanRoot(el: Element): Element | null {
  if (isHtmlTag(el, 'iframe')) return probeIframe(el as HTMLIFrameElement).innerRoot
  return el
}

// Identity of a section's detected values: everything except the per-element selector and the merge count.
// Two children with the same key are visually and semantically interchangeable in the panel.
function sectionKey(info: ElementInfo): string {
  const { selector: _selector, count: _count, ...values } = info
  return JSON.stringify(values)
}

// Surfaceable descendants of el, in document order, capped. Excludes el itself (it's the selected section).
// Includes disabled/aria-hidden elements on purpose surfacing the otherwise-unreachable ones is the point of this feature.
// Children with identical detected values (role, label, colors, …) merge into one section with a ×N count,
// so a row of identical widgets (pagination dots, star icons) doesn't flood the panel.
export function collectChildSections(el: Element): ElementInfo[] {
  const root = childScanRoot(el)
  if (!root) return []
  const reference = effectiveBackgroundColor(root)
  const sections = new Map<string, ElementInfo>()
  let detections = 0
  for (const child of root.querySelectorAll('*')) {
    // One level deep only: when root is an iframe's inner document, a nested iframe's content stays unscanned (querySelectorAll doesn't cross documents), and the frame itself isn't a section.
    if (isHtmlTag(child, 'iframe')) continue
    const role = surfaceableRole(child)
    if (!role) continue
    if (++detections > MAX_CHILD_DETECTIONS) break
    try {
      const info = collectElementInfo(child, role)
      dedupeChildBackground(info, reference)
      const key = sectionKey(info)
      const existing = sections.get(key)
      // At the section cap, duplicates of listed sections still bump their count; new uniques are dropped.
      if (existing) existing.count = (existing.count ?? 1) + 1
      else if (sections.size < MAX_CHILD_SECTIONS) sections.set(key, info)
    } catch {
      continue // a child in a cross-document (iframe) subtree that resisted inspection
    }
  }
  return [...sections.values()]
}
