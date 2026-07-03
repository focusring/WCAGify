import { getUniqueSelector } from '../unique-selector'
import { getBorderColors, getElementOwnColor, getIconColors, getTextColors } from './color'
import { getElementGradient } from './gradient'
import { firstSolidBackgroundColor, getBackgroundInfo } from './background'
import { getMediaInfo } from './media'
import { getAriaRole, isAccessibilityHidden } from './role'
import { getOutlineColor, getShadowColors } from './shadow'
import { sameColor, scanDescendants, tryParseColor } from './css-utils'
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

// Bounds both compute and panel length for pathological subtrees (e.g. a toolbar with dozens of controls).
const MAX_CHILD_SECTIONS = 20

// The role to surface for a descendant, or '' to skip it. Reuses getAriaRole, with one SVG special case:
//   • An SVG <image> embeds a raster (like <img>) → surface as media 'img'.
//   • A plain inline <svg> is an icon, not media skipped (getAriaRole returns ''); its colors show in the parent's
//     Icon row. An explicit role="img" still surfaces.
function surfaceableRole(el: Element): string {
  if (el instanceof SVGImageElement) return 'img'
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
export function collectElementInfo(el: Element, role: string = getAriaRole(el)): ElementInfo {
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

// Surfaceable descendants of el, in document order, capped. Excludes el itself (it's the selected section).
// Includes disabled/aria-hidden elements on purpose surfacing the otherwise-unreachable ones is the point of this feature.
export function collectChildSections(el: Element): ElementInfo[] {
  const reference = effectiveBackgroundColor(el)
  const sections: ElementInfo[] = []
  for (const child of el.querySelectorAll('*')) {
    const role = surfaceableRole(child)
    if (!role) continue
    const info = collectElementInfo(child, role)
    dedupeChildBackground(info, reference)
    sections.push(info)
    if (sections.length >= MAX_CHILD_SECTIONS) break
  }
  return sections
}
