---
title: 'The "no results" message of the cookie vendor search may never be announced'
sc: 4.1.3
severity: Medium
type: Technical
difficulty: Low
sample: page-10
---

![The cookie vendor list with "googlezz" typed in the search field "Zoek leveranciers". The list is empty and shows only the line "googlezz komt met geen enkele leverancier overeen."](/api/uploads/test-audit/the-no-results-message-of-the-cookie-vendor-search-may-never-be-announced-4-1-3-3b75d6bb.webp)

The search field in the cookie vendor list ("Leverancierslijst") filters the list as you type. When the search finds vendors, the count ("1 host returned.") is written into a `role="status"` container that was on the page from the start, so a screen reader announces it.

When the search finds **nothing**, that container is emptied and the message arrives in a new element instead, inserted together with its text:

    <div id="no-results" aria-live="assertive" aria-atomic="true"><p><span id="user-text">googlezz</span> komt met geen enkele leverancier overeen.</p></div>

A live region that is added to the page at the same moment as its content is often not announced, because it did not exist when the change happened. The one result a screen-reader user most needs to hear, that the list is now empty, may therefore pass in silence. Focus stays in the search field, so nothing else tells them.

This is the OneTrust consent component, which opens from every page. Also found on page-9, page-11, page-12, page-13, page-24 and page-26 (on the English pages: "… did not match any Vendors").

#### Recommendation

Write the "no results" text into the `role="status"` container that is already there, as the result count already is, instead of inserting a new live region:

    <p class="ot-scrn-rdr" role="status">googlezz komt met geen enkele leverancier overeen.</p>

Alternatively, keep `#no-results` in the page, empty, from the moment the vendor list opens ([ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)).
