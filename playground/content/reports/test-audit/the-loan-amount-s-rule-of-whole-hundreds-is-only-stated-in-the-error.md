---
title: "The loan amount's rule of whole hundreds is only stated in the error"
sc: 3.3.2
severity: Low
type: Content
sample: page-20
---

![The empty loan calculator. The amount field "Hoeveel wil je lenen?" shows the placeholder 0,00, and nothing near it says which amounts are accepted.](/api/uploads/test-audit/the-loan-amount-s-rule-of-whole-hundreds-is-only-stated-in-the-error-3-3-2-7926c6fb.webp)

![The same field after typing 7500,75 and leaving it. It now shows 750.075, with the errors "Ongeldige invoer. Voer het bedrag alleen in veelvouden van €100 in." and "Ongeldige invoer. Het maximale bedrag is €75000."](/api/uploads/test-audit/the-loan-amount-s-rule-of-whole-hundreds-is-only-stated-in-the-error-3-3-2-fc50be51.webp)

The amount field **"Hoeveel wil je lenen?"** in the loan calculator accepts only whole hundreds of euros, but that rule is stated nowhere until it has been broken. Typing 5050 gives "Ongeldige invoer. Voer het bedrag alleen in veelvouden van €100 in." Before that, the rule is not in the label, not near the field, and not in the info popover, which only gives the range "vanaf € 5.000 tot en met € 75.000".

The placeholder "0,00" suggests the opposite: that cents may be entered. They cannot. The comma is silently dropped, so "7500,75" becomes "750.075", and the user is told both that the amount must be a multiple of €100 and that the maximum is €75000, for a value they never typed.

The error messages themselves are clear, so the cost is a wasted attempt and some confusion.

#### Recommendation

State the rule with the field, linked with `aria-describedby`, and use a placeholder that does not suggest cents, or none:

    <label for="calculator-amount-6">Hoeveel wil je lenen?</label>
    <p id="amount-hint">Tussen € 5.000 en € 75.000, in hele honderden euro's</p>
    <input id="calculator-amount-6" inputmode="numeric" aria-describedby="amount-hint">

([G89](https://www.w3.org/WAI/WCAG22/Techniques/general/G89), [ARIA1](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA1))
