import { hasCssMask, splitOuterCommas } from './css-utils'

// True if el has its own text/media/mask, or wraps an icon. <a>/<button> are excluded from the descendant check — they're interactive targets, not icon containers.
const MEDIA_SELECTOR = 'img, svg, i, picture, canvas, video, audio'
function hasOwnVisibleContent(el: Element): boolean {
  if (el.matches(MEDIA_SELECTOR)) return true
  if (hasCssMask(getComputedStyle(el))) return true
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true
  }
  if (!el.matches('a, button') && el.querySelector(MEDIA_SELECTOR)) return true
  return false
}

// Elements targeted by :hover / :active / :focus* rules. Built lazily, reset per picker session.
const STATE_PSEUDO_PATTERN = /:(?:hover|active|focus(?:-visible|-within)?)\b/g
const STATE_PSEUDO_TEST = /:(?:hover|active|focus(?:-visible|-within)?)\b/

let interactiveStyledCache: WeakSet<Element> | null = null

// Resets the per-session cache of state-styled elements. Called by startPicker so a new session rescans stylesheets.
export function resetInteractiveStyledCache(): void {
  interactiveStyledCache = null
}

// Returns the compound the state pseudo is attached to, pseudo stripped. "foo:hover .bar" → "foo". ".ctas a:active .x" → "a".
function extractStateCompound(selector: string): string | null {
  const match = selector.match(STATE_PSEUDO_TEST)
  if (!match || match.index === undefined) return null
  const pseudoIdx = match.index

  let depth = 0
  let start = 0
  for (let i = pseudoIdx - 1; i >= 0; i--) {
    const ch = selector[i]
    if (ch === ')' || ch === ']') depth++
    else if (ch === '(' || ch === '[') depth--
    else if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
      start = i + 1
      break
    }
  }

  let end = selector.length
  depth = 0
  for (let i = pseudoIdx + match[0].length; i < selector.length; i++) {
    const ch = selector[i]
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
      end = i
      break
    }
  }

  const compound = selector.substring(start, end).replace(STATE_PSEUDO_PATTERN, '').trim()
  return compound || null
}

function buildInteractiveStyledSet(): WeakSet<Element> {
  const set = new WeakSet<Element>()

  function visit(rules: CSSRuleList): void {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        if (!STATE_PSEUDO_TEST.test(rule.selectorText)) continue
        for (const part of splitOuterCommas(rule.selectorText)) {
          const compound = extractStateCompound(part.trim())
          if (!compound) continue
          try {
            for (const el of document.querySelectorAll(compound)) {
              set.add(el)
            }
          } catch {} // invalid selector
        }
      } else if (rule instanceof CSSGroupingRule) {
        visit(rule.cssRules)
      }
    }
  }

  for (const sheet of document.styleSheets) {
    try {
      visit(sheet.cssRules)
    } catch {} // cross-origin sheet
  }

  return set
}

function hasInteractiveStyling(el: Element): boolean {
  interactiveStyledCache ??= buildInteractiveStyledSet()
  return interactiveStyledCache.has(el)
}

// Resolve a picker hit to its "interactive unit". Keep content-bearing hits (text/icon). Otherwise prefer the outermost <a>/<button>/custom-element with hover/focus styling; fall back to the outermost <a>/<button>, optionally promoted one level to a custom-element wrapper.
export function getPickTarget(el: Element): Element {
  if (hasOwnVisibleContent(el)) return el

  let outermostStyled: Element | null = null
  let current: Element | null = el
  while (current && current !== document.body) {
    const isInteractive = current.matches('a, button')
    const isCustom = current.localName.includes('-')
    if ((isInteractive || isCustom) && hasInteractiveStyling(current)) {
      outermostStyled = current
    }
    current = current.parentElement
  }
  if (outermostStyled) return outermostStyled

  let result: Element = el
  let foundInteractive = false
  let foundCustomWrapper = false
  current = el
  while (current && current !== document.body) {
    const isInteractiveTag = current.matches('a, button')
    const canPromoteCustom =
      foundInteractive && !foundCustomWrapper && current.localName.includes('-')

    if (isInteractiveTag || canPromoteCustom) {
      result = current
    }
    if (canPromoteCustom) foundCustomWrapper = true
    if (isInteractiveTag) foundInteractive = true
    current = current.parentElement
  }
  return result
}
