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

This is the shared site header, so it affects every page in the audit at mobile widths.

It is a separate defect from the cookie settings panel, which loses focus the same way on desktop — both come from the same omission, but they are different components and need the same fix applied twice.

#### Recommendation

Store the element that opened the drawer and restore focus to it on every close path:

    const opener = document.activeElement;   // the hamburger button
    // …on close, by the Sluiten button or by Escape:
    opener.focus();

See [G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59) and the [ARIA Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).
