---
title: External-link and PDF icons in text links tell screen-reader users nothing
sc: 1.1.1
severity: Low
type: Technical
sample: page-10
---

![The "Persoonlijk" panel of the cookie statement. The links "hier", "Google Marketing Platform", "Google Analytics 4" and "Google" each end in an arrow-out-of-a-box icon; the link "Bekijk de complete lijst cookies die we gebruiken" below ends in a plain chevron.](/api/uploads/test-audit/external-link-and-pdf-icons-in-text-links-tell-screen-reader-users-nothing-1-1-1-3b444c52.webp)

![The "De AVG" panel on the privacy page, with the link "Bekijk de privacyverklaring" followed by a small PDF file icon.](/api/uploads/test-audit/external-link-and-pdf-icons-in-text-links-tell-screen-reader-users-nothing-1-1-1-6055b78f.webp)

Text links in the CMS content end in a small icon that tells sighted readers where the link goes: an **arrow out of a box** for a link that leaves abnamro.nl and opens in a new tab, and a **PDF icon** for a link to a PDF. Both icons are inline `<svg>` elements with no `role`, no `aria-hidden`, no `<title>` and no `aria-label`, and nothing in the link text says the same.

On the cookie statement (page-10) the links "hier", "Google Marketing Platform", "Google Analytics 4" and "Google" all carry `target="_blank"` and the external-link icon. Their accessible names are just the link text, followed by an unnamed image that some screen readers read out as "image" or "unlabelled graphic". A screen-reader user is not told that the link leaves the site in a new tab, or, on the privacy page (page-9), that "<span lang="nl">Bekijk de privacyverklaring</span>" opens a PDF.

The same link component does this on page-9 ("<span lang="nl">Bekijk de privacyverklaring</span>", PDF), page-15 ("huisbankkorting"), page-19 ("<span lang="nl">Voorwaarden kortlopende reisverzekering (975 KB)</span>", the only one of its 14 PDF links whose text leaves out "PDF", and it opens a new window), page-20 ("<span lang="nl">vrijblijvend je offerte</span>", "<span lang="nl">Lees onze beoordelingen</span>", "<span lang="nl">Bereken hoeveel je kunt lenen</span>"), page-22 ("<span lang="nl">Dagelijkse bankzaken</span>", "contact") and page-26 ("call you back"). The mortgage wizard's own link component (`aab-link`) does the same on its result: "<span lang="nl">Hoe is dit berekend?</span>" opens a new tab and ends in an unnamed external-link icon (page-31).

#### Recommendation

Put the information in the link text and hide the icon, so it is announced once, in words, in every link the component renders:

    <a href="…" target="_blank">hier<span class="sr-only"> (externe website, opent in een nieuw tabblad)</span><svg aria-hidden="true" focusable="false">…</svg></a>

For the PDF variant, use "(PDF)". The cookie banner's own links already do this ("<span lang="nl">opent in een nieuw tabblad</span>"). Alternatively, give the `svg` `role="img"` and a Dutch `aria-label` ([ARIA24](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA24), [H30](https://www.w3.org/WAI/WCAG22/Techniques/html/H30), [G201](https://www.w3.org/WAI/WCAG22/Techniques/general/G201)).
