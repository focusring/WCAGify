---
title: Closing the cookie settings throws keyboard users back to the top of the page
sc: 2.4.3
severity: High
type: Technical
sample: page-10
---

![The cookie settings panel is closed with the keyboard; the focus outline disappears entirely, and pressing Tab twice moves focus to the skip link at the very top of the page.](/api/uploads/test-audit/closing-the-cookie-settings-throws-keyboard-users-back-to-the-top-of-the-page-2-4-3-20679c73.gif)

Open the cookie settings from the footer, then close them again. **All three ways out** — Enter on "<span lang="nl">Sluit voorkeurscentrum</span>", Escape inside the dialog, and Escape inside the vendor-list filter popover — leave `document.activeElement` on `<body>`.

Focus is not returned to the button that opened the panel, and it is not placed anywhere else either. Because it sits on `<body>`, the next Tab leaves the document altogether and the one after that restarts at the first skip link.

The practical effect for a keyboard user: they were at the **footer**, opened the cookie settings, closed them, and are now back at the **top of a 73-stop tab ring**. To get back to where they were they must tab through the entire page again. A screen-reader user gets no announcement that the dialog closed at all.

The panel is otherwise well built — it is a proper `role="dialog"` with `aria-modal="true"`, focus moves into it correctly on opening, and focus is genuinely trapped inside it while it is open. Only the return is missing.

This is the OneTrust consent component, which is on every page of the site.

#### Recommendation

Remember the element that opened the dialog and return focus to it on every close path:

    const opener = document.activeElement;
    // …on close, by button, by Escape, or by the filter popover's Escape:
    opener.focus();

See [G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59) and the [ARIA Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
