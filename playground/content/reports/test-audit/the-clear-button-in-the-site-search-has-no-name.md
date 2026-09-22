---
title: The clear button in the site search has no name
sc: 4.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-1
---

![The open search bar with "hypotheek" typed in it. At the right-hand end of the field sits a round icon-only button with a cross, next to the search icon.](/api/uploads/test-audit/the-clear-button-in-the-site-search-has-no-name-4-1-2-789de7b7.webp)

Open the search bar in the header and type a search term. A round **clear button** (`button#input-close-button`) appears at the right-hand end of the field. It contains only an icon and carries no `aria-label`, no `aria-labelledby`, no `title` and no text, so its accessible name is empty.

Screen-reader users hear only "button" and cannot tell what it does. Speech-recognition users have no name to say to activate it. The search bar sits in the header of every page in the audit, so the button is on every page: it was confirmed on page-2, page-4, page-5, page-6, page-11, page-18, page-19, page-23, page-24, page-26, page-27, page-28, page-29 and page-30, and it is the same component everywhere.

#### Recommendation

Give the button a name that says what it does. The visible icon is decorative, so the name belongs on the button itself:

    <button id="input-close-button" type="button" aria-label="Clear search term">…</button>

Keep the icon hidden from assistive technology with `aria-hidden="true"` so the name is not read twice ([ARIA6](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA6), [H91](https://www.w3.org/WAI/WCAG22/Techniques/html/H91)).
