---
title: Fields shown as wrong in the account application are not all exposed as wrong
sc: 4.1.2
severity: Medium
type: Technical
sample: page-30
---

![Step 2 of the account application after "Volgende" with empty fields. The Postcode and Huisnummer boxes have a red border and the message "Je hebt niets ingevuld" under them; both are outlined.](/api/uploads/test-audit/fields-shown-as-wrong-in-the-account-application-are-not-all-exposed-as-wrong-4-1-2-09cef52a.webp)

Press **"Volgende"** on step 2 of the application ("Je gegevens") with fields left empty, and each required field gets the message "Je hebt niets ingevuld. …" with a red icon. How the error reaches assistive technology differs from field to field:

- **Postcode** and **Huisnummer** get a red border but neither `aria-invalid` nor `aria-describedby`. In the accessibility tree they are valid fields with no link to their message.
- **Je voornamen**, **Je achternaam** and **Wat is je burgerservicenummer?** get `aria-invalid="true"`, but their `aria-describedby` still points only at the hint (`…HelperText1`), not at the `…-error` message beside it.
- The other fields (aanhef, voorletters, the three date boxes, the radio groups, Straat, Plaats) are wired correctly.

The messages are `role="alert"`, so a screen reader reads them out as they appear, up to twelve identical sentences at once. A user who then goes back to Postcode or Voornamen is not told that the field is wrong or why. The Mendix text-box widget behind the form is a different component from the login and pension-planner fields with the same kind of defect.

#### Recommendation

On every field shown in error, set `aria-invalid="true"` and add the message id to `aria-describedby` next to the hint. Remove both once the value is corrected:

    <input id="…_mll_18" aria-invalid="true"
           aria-describedby="…HelperText1 …_mll_18-error">

([ARIA21](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21), [ARIA1](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA1))
