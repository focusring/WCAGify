---
title: Section titles in the share prices application are not headings
sc: 1.3.1
severity: Medium
type: Technical
difficulty: Low
sample: page-17
---

![The large title Financieel nieuws, outlined, above the news search and the list of headlines. It looks like a heading but is plain text.](/api/uploads/test-audit/section-titles-in-the-share-prices-application-are-not-headings-1-3-1-13b5a508.webp)

![The page of one share, with the name EXOR in very large type at the top and the section titles Koersgegevens and Nieuws further down. None of them is a heading.](/api/uploads/test-audit/section-titles-in-the-share-prices-application-are-not-headings-1-3-1-861e5802.webp)

In the share prices application some titles look like headings but are plain `div`s:

- "Financieel nieuws" (`div.newsheader`, 32 px), the title of the news block, while its four sibling titles ("Koersoverzicht", "Grafieken", "Top 5 stijgers", "Top 5 dalers") are proper `h2` elements;
- on the page of a share: the share's name ("EXOR", `div#instrumentName`, 56 px), "Koersgegevens" and "Nieuws" (`div.koersheader`).

The page of a share has **no heading at all**, so heading navigation finds nothing on the view that every ticker and table link opens. The nested news list has none either.

Groups of like items are not marked up as lists: the five Koersoverzicht links are each a `<p>`, and the ticker's quotes are loose `div`s, so their number and grouping are not exposed. The host page marks up its comparable "Koersen beursindices" link columns as lists. The application is the supplier's (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Mark the titles up as headings, following the structure the start view already uses, and the link groups as lists:

    <h2 class="newsheader">Financieel nieuws</h2>
    <h2 id="instrumentName">EXOR</h2>
    <h3 class="koersheader">Koersgegevens</h3>
    <ul class="pagemenu"><li><a href="…">Aandelen en Opties</a></li> …</ul>

([H42](https://www.w3.org/WAI/WCAG22/Techniques/html/H42), [H48](https://www.w3.org/WAI/WCAG22/Techniques/html/H48)).
