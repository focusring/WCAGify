---
title: The feedback widget adds an empty Tab stop before its answers
sc: 2.4.3
severity: Low
type: Technical
difficulty: Low
sample: page-6
---

![A blue focus ring drawn round the whole feedback widget "Wat vind je van deze informatie?", its two thumbs tiles and the "Volgende" button, with no single control focused.](/api/uploads/test-audit/the-feedback-widget-adds-an-empty-tab-stop-before-its-answers-2-4-3-a648cba8.webp)

Tab from "Bekijk onze hulpmiddelen" towards the footer. The first stop in the feedback widget **"Wat vind je van deze informatie?"** is not an answer: it is the `div` that wraps the survey frame, which has `tabindex="0"` but no role and no name. The browser draws its ring round the whole widget and a screen reader announces nothing useful. Only the next Tab reaches the answer radios, then "Volgende". A keyboard user spends a key press on a stop that does nothing, and a screen-reader user lands on something without a name or purpose.

The wrapper is part of the Qualtrics embed (read on page-6 and page-25). It renders with a phone browser at the bottom of every content page; the widget was seen on page-2, page-6, page-12, page-13, page-15, page-18, page-19, page-22, page-24, page-25 and page-26.

#### Recommendation

Remove `tabindex="0"` from the wrapper, so the first stop is the survey's own radio group:

    <div class="QSIUserDefinedHTML"><div><iframe name="survey-iframe-…"></iframe></div></div>

([G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59))
