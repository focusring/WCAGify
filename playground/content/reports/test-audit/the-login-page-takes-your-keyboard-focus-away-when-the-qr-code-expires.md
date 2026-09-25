---
title: The login page takes your keyboard focus away when the QR code expires
sc: 2.4.3
severity: High
type: Technical
sample: page-3
---

![The login page after the QR code has expired, showing the button "QR-code verlopen. Klik om een nieuwe QR-code te maken" where the code was.](/api/uploads/test-audit/the-login-page-takes-your-keyboard-focus-away-when-the-qr-code-expires-2-4-3-15539ffd.webp)

The QR code on the login page expires after a short time — measured three times at **85, 94 and 109 seconds**. When it does, the page replaces the code with a button reading "<span lang="nl">QR-code verlopen. Klik om een nieuwe QR-code te maken</span>" and **calls `focus()` on that button**, wherever the user happens to be.

Nobody asked for that. Someone reading the alternative login methods, filling in the account number field, or working through the help text is moved to the top of the component mid-task, on a timer, with no warning. The next Tab continues from there, so their place in the page is gone and they have to find it again.

It is worth being precise about what is and is not wrong here. Because focus moves, the expiry **is** effectively conveyed to a screen-reader user — no live region does that work (the page's own `[role=alert]` and `[role=status]` elements are empty before and after), so the focus move is the only thing carrying the message. The problem is the means, not the intent: a status change should be announced, not enforced by seizing the user's position.

#### Recommendation

Leave focus where the user put it, and announce the expiry in a live region instead:

    <div role="status">QR-code verlopen. Maak een nieuwe QR-code.</div>

The page already has an empty `[role=status]` element that could carry this. Only move focus if the user activates the refresh button themselves ([F85](https://www.w3.org/WAI/WCAG22/Techniques/failures/F85), [G165](https://www.w3.org/WAI/WCAG22/Techniques/general/G165), [ARIA19](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19)).

Whether the time limit itself is permitted is a separate question, resting on whether it is essential for security under 2.2.1.
