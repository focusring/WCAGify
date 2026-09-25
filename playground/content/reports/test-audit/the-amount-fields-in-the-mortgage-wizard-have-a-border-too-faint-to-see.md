---
title: The amount fields in the mortgage wizard have a border too faint to see
sc: 1.4.11
severity: Medium
type: Design
difficulty: Low
sample: page-31
---

![The amount field of the mortgage wizard on white, with a "€" sign and the placeholder "0,00"; its only edge is a thin light-grey border on the white card.](/api/uploads/test-audit/the-amount-fields-in-the-mortgage-wizard-have-a-border-too-faint-to-see-1-4-11-9938ccb7.webp)

The amount fields in the mortgage wizard, **"<span lang="nl">Wat is uw bruto inkomen per jaar?</span>"** and **"<span lang="nl">Hoeveel geld wilt u zelf inbrengen?</span>"**, and the amount box in "<span lang="nl">Hypotheekbedrag aanpassen</span>", are all the same `aab-currency-input`. Empty, the only edge of the field is a 1 px `#cccccc` border on the white card: **1.61:1**, where 3:1 is required. The "€" sign and the placeholder "0,00" sit inside the box but do not show where it ends.

Low-vision users cannot see where the field is or how wide it is until an error turns its border red. The age field in the same wizard (`aab-input`, border `#00857a`, 4.53:1) shows the design system already has a border that passes. The e.dentifier login boxes on page-3 have the same colours, in a different component.

#### Recommendation

Give the currency input the same border as the age field, or any colour of at least 3:1 against white:

    aab-currency-input input { border: 1px solid #00857a; } /* 4.53:1 on white */

([G207](https://www.w3.org/WAI/WCAG22/Techniques/general/G207))
