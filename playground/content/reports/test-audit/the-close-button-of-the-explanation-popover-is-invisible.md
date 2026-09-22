---
title: The close button of the explanation popover is invisible
sc: 1.4.11
severity: High
type: Technical
sample: page-10
---

![The explanation popover with its heading and text, and an empty white square in the top corner where a close cross should be.](/api/uploads/test-audit/the-close-button-of-the-explanation-popover-is-invisible-1-4-11-229c12b1.webp)

Opening a glossary explanation (the ⓘ beside a term such as "Cookies") shows a popover with a close button in its corner. **The button has no visible glyph at all**: `span.emc-icon-close` paints **white on white — a contrast ratio of 1:1**.

The control is there, it is focusable, and clicking the empty space closes the popover. But nothing is drawn. A sighted user sees a blank square and has to guess, or find the control by trial and error. WCAG 1.4.11 requires the parts of a control that identify it to reach 3:1 against their background; here there is nothing to measure against anything.

This is not the icon being too light — it is the icon being the same colour as what it sits on. The likely cause is an icon utility class resolving `background-color` to white instead of `currentColor`, which means **the same class may be blanking icons elsewhere in the design system**; that is worth checking beyond this component.

The glossary popover is a shared component used across the site.

#### Recommendation

Paint the glyph in the popover's text colour rather than its background colour:

    .popover-close-btn .emc-icon-close {
      background-color: currentColor;   /* not #fff */
      color: #1e1e1e;
    }

If the icon is drawn with `mask-image`, `background-color` is what fills the mask — so it must be the ink colour, not the paper colour. Check the other icons built on the same utility class while you are there ([G195](https://www.w3.org/WAI/WCAG22/Techniques/general/G195)).
