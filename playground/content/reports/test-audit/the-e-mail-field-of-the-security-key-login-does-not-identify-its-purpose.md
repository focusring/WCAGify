---
title: The e-mail field of the security-key login does not identify its purpose
sc: 1.3.5
severity: Medium
type: Technical
difficulty: Low
sample: page-3
---

![The login form Inloggen met security key with a single field, E-mailadres, outlined.](/api/uploads/test-audit/the-e-mail-field-of-the-security-key-login-does-not-identify-its-purpose-1-3-5-0572f493.webp)

"<span lang="nl">Inloggen met security key</span>" asks for the user's own e-mail address (`input#email`, label "E-mailadres", inside `aab-inputblock-email`), but the field has **no `autocomplete` attribute**. `type="email"` alone does not identify the purpose: it names a format, not whose address it is.

Browsers and assistive tools that fill in or mark up personal fields by their purpose cannot recognise this one, so users with memory, language or motor impairments have to type the address in full on every login.

#### Recommendation

Add the matching token. The address is also the login identifier here, so `username` is a valid choice too:

    <input id="email" type="email" autocomplete="email">

([H98](https://www.w3.org/WAI/WCAG22/Techniques/html/H98)).
