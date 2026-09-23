---
title: Closing the mobile menu drops focus to the top of the document
sc: 2.4.3
severity: High
type: Technical
sample: page-5
---

![The mobile navigation drawer is opened with the hamburger button and closed again; the focus outline disappears completely instead of returning to the button.](/api/uploads/test-audit/closing-the-mobile-menu-drops-focus-to-the-top-of-the-document-2-4-3-7b0f9edd.gif)

At phone widths the hamburger button opens the navigation drawer (`#mobileMenu`). Closing it — either with Escape or with Enter on the "Sluiten" button — leaves `document.activeElement` on `<body>`.

Focus is not returned to the hamburger button that opened the drawer, and it is not placed anywhere else. The keyboard user has no idea where they are: the next Tab starts again from the beginning of the document, so they have to travel back through the whole page to reach the point they left.

Moving between levels inside the drawer loses focus the same way. Enter on a section button such as "Producten" or "Je situatie" replaces the list with that section, Enter on a category inside it swaps the level again, and so does Enter on "Terug". Each time the button that was pressed disappears and focus is left on `<body>`. In Chrome the next Tab happens to land on the first item of the new level, but at the moment of the switch nothing has focus and a screen-reader user is not told that a new level has opened. After "Terug", the next Tab lands on the first item, "Producten", not on the section the user came from. Seen on page-1, page-6, page-7 and page-22 to page-26.

This is the shared site header, so it affects every page in the audit at mobile widths.

It is a separate defect from the cookie settings panel, which loses focus the same way on desktop — both come from the same omission, but they are different components and need the same fix applied twice.

#### Recommendation

Store the element that opened the drawer and restore focus to it on every close path:

    const opener = document.activeElement;   // the hamburger button
    // …on close, by the Sluiten button or by Escape:
    opener.focus();

Inside the drawer, move focus to the first item (or the heading) of a level when it opens, and on "Terug" back to the section button that opened it.

See [G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59) and the [ARIA Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).
