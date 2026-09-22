---
title: The privacy links in the cookie vendor list are too small to hit
sc: 2.5.8
severity: Medium
type: Design
difficulty: Low
sample: page-10
---

![A row of the cookie vendor list with the link "Privacyverklaring weergeven" highlighted; the link is a thin line of text only 18 pixels high.](/api/uploads/test-audit/the-privacy-links-in-the-cookie-vendor-list-are-too-small-to-hit-2-5-8-982305bb.webp)

Open the cookie settings, then the vendor list ("Leverancierslijst"). Every vendor row carries a **"Privacyverklaring weergeven"** link that measures **175.7 by 18 pixels**, and the rows sit directly above one another so the spacing exception does not save it: the safe clickable space is 18 pixels where 24 are required.

The link is not inline in a sentence, so the inline exception does not apply either. Anyone using a touch screen, a head pointer or an imprecise mouse can easily hit the neighbouring vendor's link instead, and the list holds one of these per vendor.

The same component appears wherever the cookie settings can be opened, which is every page in the audit; it was confirmed on page-2, page-12, page-13, page-23, page-24, page-26, page-27, page-28, page-29 and page-30. On the English pages the same link reads "View Privacy Policy" and measures 117.5 by 18 pixels.

#### Recommendation

Give the link a larger clickable area — padding is enough and does not change the layout much:

    .ot-host-item .ot-host-hdr a { display: inline-block; padding: 4px 0; min-height: 24px; }

This is a OneTrust template, so the change belongs in the consent tool's configuration or its stylesheet override rather than in page code ([C42](https://www.w3.org/WAI/WCAG22/Techniques/css/C42)).
