---
title: Search suggestions are announced with HTML tags in them
sc: 4.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-1
---

![The search suggestion list for "hypotheek", where each suggestion shows the matched word in bold within the phrase.](/api/uploads/test-audit/search-suggestions-are-announced-with-html-tags-in-them-4-1-2-9d0ea868.webp)

The suggestion list highlights the matched word by wrapping it in `<b>`, and the same string is then copied into the item's `aria-label` **as literal text**. So the accessible name of a suggestion is, for example:

    aria-label="<b>Hypotheek</b> extra aflossen"

A screen reader reads the tags out. Instead of "Hypotheek extra aflossen" the user hears something like "less-than b greater-than Hypotheek less-than slash b greater-than extra aflossen", depending on the synthesiser — six of the nine suggestions for "hypotheek" are affected on this page.

The visible text is correct; only the name given to assistive technology is broken. It was confirmed on page-2, page-11, page-12 and page-26 as well, and it is the same shared search component throughout.

#### Recommendation

Build the accessible name from the plain text, not from the marked-up string:

    <li role="option" aria-label="Hypotheek extra aflossen">
      <b>Hypotheek</b> extra aflossen
    </li>

Better still, drop the `aria-label` altogether — the element's own text content already gives the right name, and the `<b>` around part of it makes no difference to how that name is computed ([ARIA6](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA6), [F87](https://www.w3.org/WAI/WCAG22/Techniques/failures/F87)).
