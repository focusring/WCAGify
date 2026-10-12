import { splitOuterCommas } from './css-utils'

// Detects whether an element's styling changes on hover, by scanning its own document's stylesheets
// for :hover rules that target it. getComputedStyle only reads the current (non-hovered) state, so the
// picker can't show the hover values themselves — this flag tells the user hover styling exists.
//
// Per-document on purpose: an element in a same-origin iframe is checked against that frame's own
// stylesheets, not the host page's.

// An unescaped :hover token. The lookbehind skips escaped colons in class names — Tailwind's
// `.hover\:underline` contains the literal text ":hover" but is not a hover rule.
// Two regexes because the global one is stateful under .test(); HOVER_TEST stays side-effect-free.
const HOVER_TEST = /(?<!\\):hover\b/
const HOVER_REPLACE = /(?<!\\):hover\b/g

// :hover replaced by an always-true pseudo (no element carries this id), so the remaining selector
// matches the elements the rule styles *as if* they were hovered — subject and descendant forms alike:
//   `.btn:hover`        → `.btn:not(#…)`        → matches the button
//   `.card:hover .btn`  → `.card:not(#…) .btn`  → matches the button (ancestor-hover styling)
// This keeps the selector structurally valid in every position (compound, bare subject, inside :is()).
const ALWAYS_TRUE = ':not(#wcagify-hover-probe)'

// Flattens a nested selector against its parent (querySelectorAll can't evaluate a relative one): `&` is the parent,
// a part without `&` is its descendant. Resolved per comma part; :is() keeps a comma-separated parent one compound.
//   `.btn { &:hover {…} }`     → `:is(.btn):hover`
//   `.card:hover { .btn {…} }` → `:is(.card:hover) .btn`
export function resolveNested(selector: string, parent: string): string {
  if (!parent) return selector
  const scope = `:is(${parent})`
  return splitOuterCommas(selector)
    .map((part) => (part.includes('&') ? part.replaceAll('&', scope) : `${scope} ${part}`))
    .join(', ')
}

// One WeakSet of hover-styled elements per document, built lazily on first lookup.
// Reset per collection run (see resetHoverStylesCache) so a re-pick sees styles injected since.
let hoverSets = new WeakMap<Document, WeakSet<Element>>()

export function resetHoverStylesCache(): void {
  hoverSets = new WeakMap()
}

function collectHoverTargets(doc: Document, set: WeakSet<Element>): void {
  // Rules are duck-typed, not instanceof-checked: an iframe document's CSS rules come from another
  // realm, where `rule instanceof CSSStyleRule` is false (same trap as the element checks in css-utils).
  // parentSelector: the enclosing style rule's resolved selector, '' at the top level.
  function visit(rules: CSSRuleList, parentSelector: string): void {
    for (const rule of rules) {
      let selector = parentSelector
      if ('selectorText' in rule && typeof rule.selectorText === 'string') {
        selector = resolveNested(rule.selectorText, parentSelector)
        if (HOVER_TEST.test(selector)) {
          for (const part of splitOuterCommas(selector)) {
            if (!HOVER_TEST.test(part)) continue
            try {
              for (const el of doc.querySelectorAll(part.replace(HOVER_REPLACE, ALWAYS_TRUE))) {
                set.add(el)
              }
            } catch {} // selector unsupported by this engine
          }
        }
      }
      // Not an `else`: style rules can nest too (Tailwind v4 hover utilities). Grouping rules (@media …) pass the parent's selector down.
      if ('cssRules' in rule) visit(rule.cssRules as CSSRuleList, selector)
    }
  }

  for (const sheet of doc.styleSheets) {
    try {
      visit(sheet.cssRules, '')
    } catch {} // cross-origin stylesheet
  }
}

// Whether some :hover rule in el's document styles el (directly or via a hovered ancestor).
export function hasHoverStyles(el: Element): boolean {
  const doc = el.ownerDocument
  let set = hoverSets.get(doc)
  if (!set) {
    set = new WeakSet()
    collectHoverTargets(doc, set)
    hoverSets.set(doc, set)
  }
  return set.has(el)
}
