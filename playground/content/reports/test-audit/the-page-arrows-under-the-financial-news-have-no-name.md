---
title: The page arrows under the financial news have no name
sc: 2.4.4
severity: Medium
type: Technical
difficulty: Low
sample: page-17
---

![The financial news list with its pagination at the bottom, the page numbers 1 to 4 between double and single arrow icons on each side. The arrows carry no text.](/api/uploads/test-audit/the-page-arrows-under-the-financial-news-have-no-name-2-4-4-598b37e2.webp)

Below the headlines in the "Financieel nieuws" block, the pagination offers four arrow links around the page numbers: first, previous, next and last page (`a.double-left`, `a.single-left`, `a.single-right`, `a.double-right`). The arrows are CSS background images, and the links have **no text, no `aria-label` and no `title`** (axe `link-name`, 4 nodes; this also fails 4.1.2). A screen reader announces "link" four times, and a speech-input user has nothing to say to activate them.

On the first page the "first" and "previous" arrows are styled as disabled (`linkDisabled`, `href="#"`) but stay in the Tab order and are not exposed as disabled, so a keyboard user meets two stops that do nothing.

The news list is a document of the supplier's application (`beursinfo.abnamro.nl/v3/nieuws_overzicht.aspx`), nested inside the page.

#### Recommendation

Name each arrow by its destination, and do not render the arrows that have nowhere to go as links:

    <a href="?p=2" class="single-right" aria-label="Volgende pagina"></a>
    <span class="single-left linkDisabled" aria-hidden="true"></span>

([ARIA8](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA8), [G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91)).
