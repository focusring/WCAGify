---
title: The logo in the middle of the login QR code is an unnamed image
sc: 1.1.1
severity: Low
type: Technical
difficulty: Low
sample: page-3
---

![The login page "Log in met QR-code" with a green QR code that has the ABN AMRO shield logo in its centre.](/api/uploads/test-audit/the-logo-in-the-middle-of-the-login-qr-code-is-an-unnamed-image-1-1-1-98f3a1b7.webp)

The QR code on the login page has the ABN AMRO shield in its centre. That logo is an `aab-icon` whose `<svg>` is the only icon on the page without `aria-hidden="true"`. It reaches the accessibility tree as an image with no name, directly before the QR code itself.

The logo is decoration: the brand is already in the header logo's text alternative, and the QR code has its own name. A screen-reader user meets an extra "image" with nothing to say, on a page they are trying to get through quickly.

#### Recommendation

Hide it from assistive technology, as every other icon on the page already is:

    <aab-icon aria-hidden="true" …></aab-icon>

Decorative images must be ignorable by assistive technology ([H67](https://www.w3.org/WAI/WCAG22/Techniques/html/H67) describes the same rule for `img`).
