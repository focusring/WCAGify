---
title: 'The "Filters wissen" button is too light against its background'
sc: 1.4.3
severity: Medium
type: Design
difficulty: Low
sample: page-10
---

![The filter panel of the cookie vendor list, with the grey "Filters wissen" button at the bottom left next to the darker "Toepassen" button.](/api/uploads/test-audit/the-filters-wissen-button-is-too-light-against-its-background-1-4-3-7da4d9ed.webp)

In the filter panel of the cookie vendor list, the **"<span lang="nl">Filters wissen</span>"** button (`#clear-filters-handler`) draws its label at an effective `#787878` on `#ffffff`. That is a contrast ratio of **4.42:1** at 14.4 pixels, just under the 4.5:1 that WCAG requires for text this size.

**The stylesheet will not explain this, so do not go looking for `#787878` in it.** The declared colour is `rgb(105,105,105)` — `#696969` — which on white measures 5.49:1 and passes comfortably. The button sits under an ancestor with **`opacity: 0.9`**, and that is what drags the painted glyphs down to `#787878`. Three independent measurements agree: a compositing walk that multiplies foreground alpha by the cumulative ancestor opacity, a rendered-pixel histogram of a screenshot, and axe-core's own 4.41.

The shortfall is small but it is a real failure, and it lands on the control that undoes a filter choice — the one a user is most likely to need after a mistake. axe flags the same button on page-7 and page-9: it is the OneTrust panel every page opens.

Unlike the other contrast results in this audit, this one is measured rather than uncertain: most colour-contrast checks on this site could not be resolved automatically because of the dark overlay behind the cookie panel, but this button sits on plain white.

#### Recommendation

Either remove the `opacity: 0.9` from the ancestor, which restores the declared `#696969` to its intended 5.49:1, or darken the label enough to survive it:

    #clear-filters-handler { color: #5a5a5a; }   /* 4.6:1 after the 0.9 opacity */

Removing the opacity is the better fix: an opacity on a container silently changes every colour inside it, so the same trap will catch the next control added to that panel ([G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)).
