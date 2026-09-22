---
title: The chosen menu category is marked by a grey background alone
sc: 4.1.2
severity: Medium
type: Technical
sample: page-21
---

![An open main-menu panel with seven category buttons down the left; one has a light grey background and the rest are white.](/api/uploads/test-audit/the-chosen-menu-category-is-marked-by-a-grey-background-alone-4-1-2-562e626a.webp)

Opening a main-menu panel shows seven category buttons down the left ("Betalen & creditcards", "Hypotheken" … "Pensioen"). Choosing one loads its links into the panel beside it, and the chosen button turns `rgb(222,222,222)` while the other six stay white.

That background change is the **only** signal. None of the seven carries `aria-expanded`, `aria-selected` or `aria-current`, so nothing in the accessibility tree says which category is showing. A screen-reader user moving through the seven buttons is given no way to tell which one produced the links they are now reading, and no way to confirm that pressing one had any effect.

This is the shared header, so it applies to every page in the audit.

It is a separate problem from the top-level menu buttons, which carry `aria-expanded` on the wrong element — that is filed separately. Here the attribute is absent altogether.

#### Recommendation

These behave as a set of choices controlling one panel, so expose the current one:

    <button aria-current="true" aria-controls="menu-panel">Betalen & creditcards</button>
    <button aria-current="false" aria-controls="menu-panel">Hypotheken</button>

Keep the value in step with the grey background, and make sure the panel is named by whichever category is current ([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16), [G138](https://www.w3.org/WAI/WCAG22/Techniques/general/G138)).
