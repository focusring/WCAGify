---
title: Header controls and search headings on English pages are in Dutch
sc: 3.1.2
severity: Low
type: Content
difficulty: Low
sample: page-26
---

![The search overlay on the English site at 320 px wide with "mortgage" typed. English suggestions such as "Adjust mortgage interest" and "Annuity mortgage" sit under the Dutch group headings "Zelf regelen" and "Meteen naar".](/api/uploads/test-audit/header-controls-and-search-headings-on-english-pages-are-in-dutch-3-1-2-298ab90a.webp)

The English build of the site (`lang="en"`) carries Dutch text in the shared header, and none of it is marked `lang="nl"`. An English speech synthesiser reads it with English pronunciation rules.

- In the phone-width header the two buttons at the top are named **"Taal - EN"** and **"Kies Segment - Personal"**. Their visible text is "EN" and "Personal", but the names a screen reader announces are Dutch phrases ("Taal" is language, "Kies Segment" is choose segment). They are the first two controls in that header.
- The search overlay that phones and zoomed windows get groups its English suggestions under the Dutch headings **"Zelf regelen"** and **"Meteen naar"**. The desktop search bar on the same page shows "Self service…" and "Straight to…", so the overlay simply misses the translation.

The button names were found on page-2 and page-26, the Dutch headings on page-26. It is the same header on every English page.

#### Recommendation

Localise these strings with the rest of the component: "Language - EN", "Choose segment - Personal", "Self service" and "Straight to", as the desktop search already does. If a Dutch word is kept on purpose, mark it with `lang="nl"` ([H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)).
