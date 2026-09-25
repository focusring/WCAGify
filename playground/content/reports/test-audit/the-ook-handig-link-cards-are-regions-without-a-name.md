---
title: 'The "Ook handig" link cards are regions without a name'
sc: 1.3.1
severity: Low
type: Technical
difficulty: Low
sample: page-12
---

![The "Ook handig" section with two white cards outlined in red, each holding a list of links such as "Studentenrekening", "International clients" and "Extra betaalrekening openen". Neither card has a title of its own.](/api/uploads/test-audit/the-ook-handig-link-cards-are-regions-without-a-name-1-3-1-9a7d9dcd.webp)

The link cards of the related-links component ("<span lang="nl">Ook handig</span>" on this page) each carry `role="region"`, but with neither `aria-label` nor `aria-labelledby`. A region without a name is not exposed as a landmark, so the tree shows two bare wrappers: the structure the author marked up is lost for screen-reader users who navigate by landmarks.

The same component fills this name on every other card of the page ("<span lang="nl">Voor mezelf</span>", "<span lang="nl">Zakelijke bankrekening openen</span>" …), so this is an empty field of the link cards, not a design choice. The links inside each card are a proper list, so the grouping of the links survives; what is lost is the region itself.

The same two unnamed regions are on page-13, page-14 ("<span lang="nl">Meest gezocht over hypotheken</span>"), page-19, page-21, page-23 (where the section has no heading at all), page-26 ("Most frequently searched terms about mortgages") and page-27 (four cards under "<span lang="nl">Meer over duurzaam wonen</span>" and "<span lang="nl">Meest gezocht over hypotheken</span>").

#### Recommendation

Either give each card a visible title and point the region at it, or drop the role from cards that have no title:

    <div class="group-cards" role="region" aria-labelledby="ook-handig-1">
      <h3 id="ook-handig-1">Rekeningen</h3>
      <ul>…</ul>
    </div>

The list inside the card keeps the grouping on its own ([ARIA20](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA20), [ARIA13](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA13)).
