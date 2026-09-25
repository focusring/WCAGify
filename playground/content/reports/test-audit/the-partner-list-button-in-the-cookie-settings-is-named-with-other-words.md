---
title: The partner-list button in the cookie settings is named with other words
sc: 2.5.3
severity: Medium
type: Technical
difficulty: Low
sample: page-2
---

![The cookie centre open on the "Personal cookies" tab. The link-styled button "View list of used cookies" under the category text is outlined in red.](/api/uploads/test-audit/the-partner-list-button-in-the-cookie-settings-is-named-with-other-words-2-5-3-55112c80.webp)

Each cookie category in the cookie settings ("Functional cookies", "Analytical cookies", "Personal cookies") has a link-styled button that opens the vendor list. On the English pages it reads **"View list of used cookies"**, but its `aria-label` replaces that text with "Personal cookies - List of used cookies button opens list of used cookies". The visible word "View" is not in the name.

On the Dutch pages the gap is wider. The button reads **"<span lang="nl">Bekijk lijst van partners</span>"** and is named "Persoonlijke cookies - De knop "Bekijk lijst van cookies" opent de lijst met cookies.", so "partners" is missing and the words in the name describe a different list. A speech-input user who says "click Bekijk lijst van partners" does not reach the button. A screen-reader user hears a label that differs from the one a sighted colleague would refer to.

This is the OneTrust consent component, which opens from every page. It was confirmed on page-1, page-4 to page-13, page-18, page-19 and page-22 to page-24, on all three category tabs and at phone width as well.

#### Recommendation

Let the name start with the visible text. The simplest fix is to drop the `aria-label` and add the category as visually hidden text after the visible words:

    <button class="ot-link-btn category-host-list-handler">Bekijk lijst van partners<span class="ot-scrn-rdr"> voor persoonlijke cookies</span></button>

In OneTrust, set the accessibility label of the vendor-list link in the preference-centre template to the same wording as the link text ([G208](https://www.w3.org/WAI/WCAG22/Techniques/general/G208), failure [F96](https://www.w3.org/WAI/WCAG22/Techniques/failures/F96)).
