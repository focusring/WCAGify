---
title: Switching to security-key or QR-code login leaves keyboard focus behind
sc: 2.4.3
severity: High
type: Technical
sample: page-3
---

![On the login page "Inloggen met security key" is activated with Enter. The security-key form with its e-mail field replaces the QR code, and no element of the new form receives focus.](/api/uploads/test-audit/switching-to-security-key-or-qr-code-login-leaves-keyboard-focus-behind-2-4-3-3eb7f9b8.gif)

The login page switches between its methods with the links **"Inloggen met security key"** and **"Inloggen met QR-code"**. Pressing Enter on one replaces the panel, and the link that was pressed disappears with it. Focus is not moved anywhere: it falls to the page body.

The browser then continues from where the removed link was, so the next Tab lands on "Inloggen met e.dentifier", **after** the new form. The e-mail field, "Onthoud e-mailadres" and the "Verder" button are skipped; a keyboard user reaches them only by going back with Shift+Tab. Nothing is announced either, so to a screen-reader user the link seems to do nothing. This was reproduced for the security-key switch, the QR-code switch and the QR code's refresh button.

The same widget shows how it should work: "Inloggen met e.dentifier" moves focus to its first field, the account number.

#### Recommendation

After the panel is replaced, move focus to the first field of the new panel, as the e.dentifier switch already does, or to the panel's heading with `tabindex="-1"`:

    emailInput.focus();

Because these controls change the panel rather than open a page, they are better exposed as buttons ([G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59), [F85](https://www.w3.org/WAI/WCAG22/Techniques/failures/F85)).
