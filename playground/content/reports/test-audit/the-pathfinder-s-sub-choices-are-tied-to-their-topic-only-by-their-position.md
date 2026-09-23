---
title: "The pathfinder's sub-choices are tied to their topic only by their position"
sc: 1.3.1
severity: Medium
type: Technical
sample: page-23
---

![The pathfinder Kies je situatie en pas de juiste limiet aan with Online betalen en overboeken chosen in the first column and three further columns outlined to its right, each holding the sub-choices of the grey item to its left.](/api/uploads/test-audit/the-pathfinder-s-sub-choices-are-tied-to-their-topic-only-by-their-position-1-3-1-d88750ca.webp)

In the pathfinder "Kies je situatie en pas de juiste limiet aan", choosing a topic ("Online betalen en overboeken") opens its sub-choices as a new column to the right, up to three columns deep, and then the answer below. On screen each column plainly belongs to the grey item to its left.

In the markup every column is a separate `ul` in its own grid cell, not nested in the item that opened it. The opening button has `aria-expanded` but no `aria-controls`, and the lists have no name and no heading. A screen reader reads the expanded button, then the four other topic buttons, then an unnamed list, then another unnamed list: which list belongs to which choice is conveyed by column position alone. The chosen answer link is marked only by its grey fill (`li.answer.active`), with no `aria-current`.

Also on page-4, where the same component opens "Passen" into "Betaalpas" and "Creditcard".

#### Recommendation

Nest each revealed list inside the `li` of the item that opens it, or link and name it explicitly:

    <button id="pf-main-0" aria-expanded="true" aria-controls="pf-col-main-0">Online betalen en overboeken</button>
    <ul id="pf-col-main-0" aria-labelledby="pf-main-0">…</ul>

Mark the chosen answer link with `aria-current="true"` ([H48](https://www.w3.org/WAI/WCAG22/Techniques/html/H48), [G115](https://www.w3.org/WAI/WCAG22/Techniques/general/G115)).
