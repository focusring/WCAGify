---
title: Screen readers are told cash is covered by the standard travel policy
sc: 1.3.1
severity: High
type: Technical
sample: page-19
---

![The "Standaard dekking" card listing what the policy covers, with "Contant geld" shown in grey with a line through it and a cross beside it, while the items above have ticks.](/api/uploads/test-audit/screen-readers-are-told-cash-is-covered-by-the-standard-travel-policy-1-3-1-852ee0af.webp)

The **"<span lang="nl">Standaard dekking</span>"** card lists what the standard travel policy covers. One item — **"<span lang="nl">Contant geld</span>"** — is _not_ covered, and the page shows that in three visual ways: the text is struck through, it is greyed out, and the tick beside it is replaced by a cross.

None of those reach assistive technology. There is no `<del>` or `<s>` element, no word anywhere saying the item is excluded, and the accessibility tree exposes it as an ordinary list item — `listitem → StaticText "Contant geld"` — **identical to the eight items that are covered**.

The markers make it worse. The ✓ and ✗ beside all 18 items across both cards are 24 by 24 pixel `::before` boxes drawn with an SVG `mask-image`. They are not elements, so they appear nowhere in the accessibility tree at all.

The result is not a missing label but a **reversal of meaning**: a screen-reader user reading this card is told that cash _is_ covered by the standard policy. They could buy the wrong product on the strength of it.

#### Recommendation

Say the state in text, so it does not depend on the styling:

    <li class="minus">
      <span class="visually-hidden">Niet gedekt:</span> Contant geld
    </li>

Give the tick and cross a text alternative too — an inline `<svg role="img">` with a `<title>`, or a visually hidden word beside each item. If the strikethrough is meant to carry meaning on its own, wrap the text in `<del>`, but a word is clearer and does not rely on the element being announced ([F2](https://www.w3.org/WAI/WCAG22/Techniques/failures/F2), [F3](https://www.w3.org/WAI/WCAG22/Techniques/failures/F3), [G138](https://www.w3.org/WAI/WCAG22/Techniques/general/G138)).
