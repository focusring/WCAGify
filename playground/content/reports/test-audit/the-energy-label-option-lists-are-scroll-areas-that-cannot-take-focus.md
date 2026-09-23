---
title: The energy-label option lists are scroll areas that cannot take focus
sc: 2.1.1
severity: Low
type: Technical
sample: page-14
---

![The mortgage calculator with the "Energielabel" dropdown open. The list shows A+++, A++, A+ and a ticked A; the other labels are further down in the scrolling list.](/api/uploads/test-audit/the-energy-label-option-lists-are-scroll-areas-that-cannot-take-focus-2-1-1-c2738190.webp)

In the mortgage calculator, the open **"Energielabel"** dropdown (PrimeVue Select) shows its 14 energy labels in a scroll container, `div[data-pc-section="listcontainer"]` with `max-height: 14rem` and `overflow: auto`. The container scrolls, but it is not focusable and contains nothing focusable, so axe reports `scrollable-region-focusable`.

Keyboard users do reach every option. The arrow keys, Home and End on the focused dropdown move through all 14 labels and scroll the list with them. That is why the severity is Low: the fault is in the markup, not in what a keyboard user can do.

The "Energielabel" chooser in the mortgage-rate tool (page-15) has the same fault in a different component: its `aab-select` list (`ul role="listbox" tabindex="-1"`) scrolls, cannot take focus, and is also reached through the arrow keys.

#### Recommendation

Remove the extra scroll container. Let the list be as tall as its options, or make the listbox itself the scrolling element. If a separate scroll container has to stay, make it focusable with `tabindex="0"` so the region can be scrolled without a pointer ([G202](https://www.w3.org/WAI/WCAG22/Techniques/general/G202)).
