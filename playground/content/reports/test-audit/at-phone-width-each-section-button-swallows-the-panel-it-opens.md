---
title: At phone width each section button swallows the panel it opens
sc: 4.1.2
severity: Medium
type: Technical
sample: page-9
---

![The "Meer informatie" accordion at 393 px wide with the section "De AVG" open, outlined in red from its button down to the link "Bekijk de privacyverklaring" with a PDF icon; the closed section "De wet PSD2, wat betekent dat?" follows.](/api/uploads/test-audit/at-phone-width-each-section-button-swallows-the-panel-it-opens-4-1-2-e8c9afb6.webp)

At phone width the "<span lang="nl">Meer informatie</span>" section widget on the privacy page turns into an accordion. Each section button carries `aria-owns` pointing at its own panel, as well as `aria-controls`. `aria-owns` moves the panel **into the button** in the accessibility tree, although the panel is not inside the button in the DOM.

With "<span lang="nl">De AVG</span>" open, the tree reads one button whose name is the whole panel: `button "De AVG De AVG De AVG (Algemene Verordening Gegevensbescherming) en Uitvoeringswet AVG gaan over … Bekijk de privacyverklaring"`, with the heading, the paragraph and the link "<span lang="nl">Bekijk de privacyverklaring</span>" as its children. Two things break:

- the button's name is no longer "<span lang="nl">De AVG</span>" but a paragraph of text, read out every time the button is reached;
- a focusable link and a heading become children of a button, whose children are presentational, so screen readers may flatten or drop them.

The same happens in the address-change widget on page-22 at 640 and 320 px, where the opened panel's five links ("<span lang="nl">Adres wijzigen</span>", "<span lang="nl">Dagelijkse bankzaken</span>", …) end up inside the button. Other instances of the component (page-13, page-14, page-15, page-18, page-19, page-20) were not checked at phone width. axe's `nested-interactive` rule looks only at DOM descendants and does not catch this.

#### Recommendation

Remove `aria-owns` from the buttons and keep only `aria-controls` pointing at the panel, which stays a sibling of its button:

    <button aria-expanded="true" aria-controls="tcm-51888-2-content">De AVG</button>
    <div id="tcm-51888-2-content">…</div>

That is the disclosure pattern; it needs no ownership relation ([ARIA5](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5)).
