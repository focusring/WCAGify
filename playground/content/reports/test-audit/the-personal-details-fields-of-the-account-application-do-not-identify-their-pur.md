---
title: The personal-details fields of the account application do not identify their purpose
sc: 1.3.5
severity: Medium
type: Technical
difficulty: Low
sample: page-30
---

![Step 2 "Je gegevens" of the account application, empty, with the fields for initials, first names, surname, date of birth, citizen service number, nationality, postcode and house number.](/api/uploads/test-audit/the-personal-details-fields-of-the-account-application-do-not-identify-their-pur-1-3-5-44b88a7b.webp)

Every text field on step 2 of the application ("<span lang="nl">Je gegevens</span>") carries `autocomplete="on"`. That value only switches autofill on. It does not say what the field asks for, so neither browsers nor assistive tools can fill in or mark up the visitor's own details:

- **Je voornamen**: `on`, should be `given-name`
- **Je achternaam**: `on`, should be `family-name`
- **Geboortedatum** Dag / Maand / Jaar: `on`, should be `bday-day` / `bday-month` / `bday-year`
- **Postcode**: `on`, should be `postal-code`
- **Straat** and **Plaats** (editable when the address lookup fails): `on`, should be `address-line1` / `address-level2`

People with motor or cognitive impairments, who rely on autofill or on icons shown next to known fields, have to type all of this by hand. axe does not flag it, because `on` is a valid value.

#### Recommendation

Give each field its purpose token:

    <input id="…voornamen" autocomplete="given-name">
    <input id="…postcode" autocomplete="postal-code">

([H98](https://www.w3.org/WAI/WCAG22/Techniques/html/H98))
