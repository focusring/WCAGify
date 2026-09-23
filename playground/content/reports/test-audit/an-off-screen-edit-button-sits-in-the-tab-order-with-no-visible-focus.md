---
title: 'An off-screen "Edit" button sits in the tab order with no visible focus'
sc: 2.4.7
severity: Medium
type: Technical
sample: page-10
---

![Tabbing past the last footer link. The focus outline vanishes from the page entirely while the browser reports a focused button, then the next Tab leaves the document.](/api/uploads/test-audit/an-off-screen-edit-button-sits-in-the-tab-order-with-no-visible-focus-2-4-7-e8ebae44.gif)

A Contentstack live-preview control (`button#cslp-tooltip`, accessible name **"Edit"**) is rendered into the production page. It is positioned `fixed` at `top: -900px`, so it sits 900 pixels above the viewport and is never seen — but it carries no `aria-hidden` and no negative `tabindex`, so it is an ordinary stop in the tab order.

It is **the last stop of 73**. Pressing Tab there focuses it — `:focus-visible` matches and it is still focused a second and a half later — while its computed `outline-style` is `none` and nothing at all changes on screen.

A sighted keyboard user sees the focus outline disappear from the page with no indication of where it went, presses Tab again expecting to move on, and instead leaves the document. There is no way to tell from the screen that a control was focused, let alone what it does.

The button was found in the tab order on page-1, page-2, page-5 to page-9, page-11, page-13, page-14, page-16 to page-19, page-21 to page-27 and page-29 to page-31 — it is injected into every CMS-rendered page.

#### Recommendation

The live-preview tooling should not ship to the public site at all; removing it from the production build fixes this and removes an authoring control from visitors' reach.

If it must stay, take it out of the tab order and hide it from assistive technology:

    <button id="cslp-tooltip" tabindex="-1" aria-hidden="true">Edit</button>

Hiding an element by moving it off screen while leaving it focusable is [F78](https://www.w3.org/WAI/WCAG22/Techniques/failures/F78); see also [G149](https://www.w3.org/WAI/WCAG22/Techniques/general/G149).
