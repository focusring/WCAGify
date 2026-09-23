---
title: The filter button in the cookie vendor list has a wrong name and a stale state
sc: 4.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-10
---

![The cookie vendor list "Leverancierslijst" with the round funnel button at the top right and the filter popover "Cookielijstfilters" open beneath it, showing three checkboxes and the buttons "Toepassen" and "Annuleren".](/api/uploads/test-audit/the-filter-button-in-the-cookie-vendor-list-has-a-wrong-name-and-a-stale-state-4-1-2-a3e16923.webp)

![The same vendor list after "Annuleren" was pressed. The filter popover is gone and the funnel button is outlined in red; nothing on screen is open.](/api/uploads/test-audit/the-filter-button-in-the-cookie-vendor-list-has-a-wrong-name-and-a-stale-state-4-1-2-0beddb21.webp)

In the cookie vendor list ("Leverancierslijst"), the round **funnel button** (`button#filter-btn-handler`) opens the "Cookielijstfilters" popover. It has two defects.

- **Its name describes a different function.** The button is named "Bekijk lijst van cookies Leverancierslijst" ("View list of used cookies Vendors List" on the English pages), and its SVG `<title>` says the same. Screen-reader users hear a button that shows a cookie list, not one that filters the vendors. When the list is opened from the first tab, the name reads "Filter Leverancierslijst" instead, so the same button changes its name depending on the route.
- **Its state does not follow the popover.** `aria-expanded` turns `true` when the popover opens but stays `true` after it is closed with Escape or with the popover's own "Annuleren" button. Assistive technology then reports an open popover that is no longer there. Focus is also lost on close; that is part of the filed issue on focus return from the cookie settings.

This is the OneTrust consent component, available on every page. The name was recorded on page-2, page-7, page-9, page-10, page-13 and page-24. The stale state was reproduced on page-10 by both routes.

#### Recommendation

Name the button after what it does, and reset its state in every handler that hides the popover ("Annuleren", "Toepassen" and Escape):

    <button id="filter-btn-handler" aria-label="Filter leveranciers" aria-haspopup="true" aria-expanded="false">

    filterPopover.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');

Give the SVG `<title>` the same wording or remove it ([ARIA14](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA14), [ARIA5](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5)).
