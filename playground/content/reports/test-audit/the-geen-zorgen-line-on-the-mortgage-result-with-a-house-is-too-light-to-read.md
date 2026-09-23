---
title: 'The "Geen zorgen" line on the mortgage result with a house is too light to read'
sc: 1.4.3
severity: Medium
type: Design
difficulty: Low
sample: page-31
---

![The block "Klaar voor de volgende stap?" on the mortgage result with a house, with the small light-grey sentence "Geen zorgen, u zit nog nergens aan vast. …" under the button "Verder met uw aanvraag".](/api/uploads/test-audit/the-geen-zorgen-line-on-the-mortgage-result-with-a-house-is-too-light-to-read-1-4-3-add46921.webp)

After **"Voeg een woning toe"**, the mortgage result shows a block "Klaar voor de volgende stap?". Its closing sentence, **"Geen zorgen, u zit nog nergens aan vast. U betaalt pas eventuele advies- en handelingskosten nadat u de hypotheekofferte heeft ondertekend."**, is `#808080` on white at 14 px: **3.94:1**, below the 4.5:1 required (axe `color-contrast`).

It is the one sentence that tells the visitor that continuing costs nothing yet. Low-vision users may miss it, or not risk the next step because of it.

#### Recommendation

Darken the text to at least `#767676` on white (4.54:1), or better, use the body text colour:

    .mover-next-step__additional { color: #595959; } /* 7.0:1 on white */

([G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18))
