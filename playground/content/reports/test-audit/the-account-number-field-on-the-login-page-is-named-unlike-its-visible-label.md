---
title: The account number field on the login page is named unlike its visible label
sc: 2.5.3
severity: High
type: Technical
difficulty: Low
sample: page-3
---

![The e.dentifier login form with the label Rekening- en pasnummer above two boxes. The first box, after the prefix NL ** ABNA 0, is outlined.](/api/uploads/test-audit/the-account-number-field-on-the-login-page-is-named-unlike-its-visible-label-2-5-3-bc148e50.webp)

In the e.dentifier login, the first box under the visible label **"Rekening- en pasnummer"** (`input#account-number`) has the accessible name "ABN AMRO Rekeningnummer". It comes from an `aria-label`, which overrides the `<label for>`, and the two share not a single word.

A speech-input user who says "klik Rekening- en pasnummer" reaches nothing, and a screen-reader user hears a name that appears nowhere on screen. This is the first field of the login, on both the Privé and the Zakelijk tab. The small box beside it, named "Pasnummer", carries the last word of the shared label and is fine.

#### Recommendation

Remove the `aria-label`, so the visible label gives the name, or start the name with the visible label and add which part of it the box is:

    <input id="account-number" aria-label="Rekening- en pasnummer: rekeningnummer">
    <input id="card-number" aria-label="Rekening- en pasnummer: pasnummer">

([G208](https://www.w3.org/WAI/WCAG22/Techniques/general/G208), [F96](https://www.w3.org/WAI/WCAG22/Techniques/failures/F96)).
