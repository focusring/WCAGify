---
title: A panel widget announces itself as collapsed while its content is on screen
sc: 4.1.2
severity: High
type: Technical
sample: page-22
---

![The "Of e-mail, telefoonnummer of naam" section with the first panel open and its content visible, while all five section buttons look identical and none appears selected.](/api/uploads/test-audit/a-panel-widget-announces-itself-as-collapsed-while-its-content-is-on-screen-4-1-2-7cffcb3f.webp)

The five-section widget on this page ("adres", "e-mail", "telefoonnummer", "naam", "zakelijk adres") is built twice: a desktop rendering that is visible, and a mobile copy that is `display:none`. **Every button's `aria-controls` points at the hidden mobile copy**, not at the panel the reader can see.

The consequence is that on a fresh page load **all five buttons report `aria-expanded="false"` while the first panel is plainly open on screen**. The flag is truthful about the hidden copy it references, which is exactly what makes the visible page contradict itself: a screen-reader user is told everything is collapsed, and finds content anyway.

The visible panels carry `role="tabpanel"` with no accessible name and no `tabindex`, and **no `tab` or `tablist` owns them** — the page's only `tablist` is inside the cookie panel and unrelated. The buttons themselves have no role, no `aria-selected`, and no visual selected state: with panel 1 open, all five render identically.

The same component behaves the same way in the "Meer informatie" block on the travel insurance page (page-19) and the step foldouts on page-13, so this is a template, not a page.

#### Recommendation

Decide which pattern it is and build only that one. These are disclosures, not tabs, so the simplest correct version drops the tab roles entirely:

    <button aria-expanded="true" aria-controls="section-adres">Adres</button>
    <div id="section-adres" role="region" aria-labelledby="section-adres-button">…</div>

Point `aria-controls` at the panel that is actually rendered, and keep `aria-expanded` in step with what is visible. If the mobile and desktop renderings must stay separate, only one of them may be in the DOM at a time ([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16), [ARIA11](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11)).
