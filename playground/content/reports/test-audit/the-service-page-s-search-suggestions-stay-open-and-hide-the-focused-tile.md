---
title: "The service page's search suggestions stay open and hide the focused tile"
sc: 2.4.11
severity: Medium
type: Technical
sample: page-4
---

![The "Waarmee kunnen we je vooruit helpen?" search with "pas" typed. Its suggestion list hangs over the row of tiles below it and covers the "Betaalpas blokkeren" tile and the one next to it almost completely.](/api/uploads/test-audit/the-service-page-s-search-suggestions-stay-open-and-hide-the-focused-tile-2-4-11-2ed071fb.webp)

The search field **"Waarmee kunnen we je vooruit helpen?"** on the Service en Contact page opens a suggestion list as soon as something is typed. The list is drawn over the page (an opaque white panel at `z-index: 10`), and it **does not close when focus leaves it**.

Type "pas", then keep pressing Tab: focus moves through the clear button and the list, and on to the tiles underneath. "Betaalpas blokkeren" is still partly visible, but the next tile, **"Betaalpas deblokkeren"**, is covered completely: every point of the focused tile is behind the list. Escape does not close the list, and scrolling does not help, because the list moves with the field. It is still open when focus has moved on to the topic chooser further down.

A keyboard user sees the focus outline disappear under the list and has no way to bring the focused tile back into view short of clicking elsewhere. The header search bar does not have this problem, because the whole bar closes when focus leaves it.

#### Recommendation

Close the suggestion list when focus moves to anything outside the field and the list, and on Escape, as the combobox pattern expects:

    searchWidget.addEventListener('focusout', e => {
      if (!searchWidget.contains(e.relatedTarget)) closeSuggestions()
    })

See the [ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and [Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum), which counts a list left open after focus has moved away as obscuring content.
