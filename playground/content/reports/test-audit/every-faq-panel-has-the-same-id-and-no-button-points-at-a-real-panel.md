---
title: Every FAQ panel has the same id and no button points at a real panel
sc: 4.1.2
severity: Medium
type: Technical
sample: page-13
---

![The "Veelgestelde vragen" section with one question expanded, showing the answer panel below the question button.](/api/uploads/test-audit/every-faq-panel-has-the-same-id-and-no-button-points-at-a-real-panel-4-1-2-bcb7cfd9.webp)

In the **"Veelgestelde vragen"** accordion every question button carries `aria-controls="pv_id_0_0_0_0_7_accordioncontent_<n>"`, and **no element with any of those ids exists in the document**. The panels that are actually rendered all carry the same literal `id="accordion-content"` — twelve elements sharing one id on this page.

So the relationship between a question and its answer is broken in one direction, and any assistive technology that follows `aria-controls` to move the user to the panel lands nowhere. The duplicated id also means a reference to `accordion-content` cannot resolve to a single element.

This is the shared accordion component, not a page-specific mistake. It was confirmed on page-8 (3 panels), page-10 (8), page-13 (12 of 12), page-18 (12), page-19 (5), page-21 (7), page-22 (4) and page-29 (5).

Automated testing understates this badly: the accordion does not render collapsed panels, so axe-core only ever reports the one panel that happens to be open. On page-18, 13 of the 21 `aria-controls` attributes on the page resolve to nothing.

#### Recommendation

Give each rendered panel the unique id its button already names, and drop the hard-coded `id="accordion-content"`:

    <button aria-expanded="true" aria-controls="faq-panel-3">…</button>
    <div id="faq-panel-3" role="region" aria-labelledby="faq-button-3">…</div>

PrimeVue generates matching ids by default, so the fix is to stop the wrapper overriding them ([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
