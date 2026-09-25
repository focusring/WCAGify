---
title: Closing the header search leaves keyboard focus nowhere
sc: 2.4.3
severity: Medium
type: Technical
sample: page-2
---

![The search bar in the header is opened from the keyboard, "mortgage" is typed and the cross at the end of the field is pressed. The bar closes and no focus outline is left anywhere on the page.](/api/uploads/test-audit/closing-the-header-search-leaves-keyboard-focus-nowhere-2-4-3-eddf16cc.gif)

Pressing Enter on **"<span lang="nl">Open zoekbalk</span>"** ("Open search bar" on the English site) opens the header search and puts focus in the field, which is correct. After typing, Tab reaches the cross at the end of the field. Pressing Enter on it clears the text, closes the whole bar and leaves `document.activeElement` on `<body>`. The control that had focus is gone and nothing takes its place, so there is no focus outline on screen and a screen reader announces nothing. In Chrome the next Tab happens to land on "<span lang="nl">Open zoekbalk</span>" again, but focus should be put there when the bar closes.

The overlay version of the search, which phones get, has the same fault. Under an iPhone user agent, "Sluiten" closes the overlay and leaves focus on `<body>` as well. Escape is worse there: it does not close the overlay but moves focus behind it, to the chat button and then the footer links. The search screen stays in front, so the keyboard user sees nothing change while focus moves through controls they cannot see (this is also a 2.4.11 failure).

This is the shared header search. The cross was checked on page-1, page-2, page-4, page-6, page-8, page-11, page-12, page-16, page-18, page-22, page-23, page-24 and page-26, and the phone overlay on page-4.

#### Recommendation

On every close path (the cross, "Sluiten" and Escape), close the search and put focus back on the button that opened it:

    function closeSearch() {
      hideSearchBar();
      document.querySelector('#search-desktop button[aria-label="Open zoekbalk"]').focus();
    }

If the cross is only meant to clear the text, keep the bar open and leave focus in the field. See [G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59) and [F85](https://www.w3.org/WAI/WCAG22/Techniques/failures/F85).
