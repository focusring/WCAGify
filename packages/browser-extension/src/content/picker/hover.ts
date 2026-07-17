import { splitOuterCommas } from './css-utils'

// Detects whether an element's styling changes on hover, by scanning its own document's stylesheets
// for :hover rules that target it. getComputedStyle only reads the current (non-hovered) state, so the
// picker can't show the hover values themselves — this flag tells the user hover styling exists.
//
// Per-document on purpose: children collected from a same-origin iframe must be checked against the
// iframe's stylesheets (iframe.contentDocument.styleSheets), not the host page's.

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

// One WeakSet of hover-styled elements per document, built lazily on first lookup.
// Reset per collection run (see resetHoverStylesCache) so a re-pick sees styles injected since.
let hoverSets = new WeakMap<Document, WeakSet<Element>>()

export function resetHoverStylesCache(): void {
  hoverSets = new WeakMap()
}

function collectHoverTargets(doc: Document, set: WeakSet<Element>): void {
  // Rules are duck-typed, not instanceof-checked: an iframe document's CSS rules come from another
  // realm, where `rule instanceof CSSStyleRule` is false (same trap as the element checks in css-utils).
  function visit(rules: CSSRuleList): void {
    for (const rule of rules) {
      if ('selectorText' in rule && typeof rule.selectorText === 'string') {
        if (!HOVER_TEST.test(rule.selectorText)) continue
        for (const part of splitOuterCommas(rule.selectorText)) {
          if (!HOVER_TEST.test(part)) continue
          try {
            for (const el of doc.querySelectorAll(part.replace(HOVER_REPLACE, ALWAYS_TRUE))) {
              set.add(el)
            }
          } catch {} // selector unsupported by this engine
        }
      } else if ('cssRules' in rule) {
        visit(rule.cssRules as CSSRuleList) // @media / @supports / @layer …
      }
    }
  }

  for (const sheet of doc.styleSheets) {
    try {
      visit(sheet.cssRules)
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
