---
title: "The first error on the login's e-mail and Respons fields is likely not announced"
sc: 4.1.3
severity: Medium
type: Technical
difficulty: Low
sample: page-3
---

![The security-key login after leaving the empty E-mailadres field, with the warning Dit veld is verplicht. below it.](/api/uploads/test-audit/the-first-error-on-the-login-s-e-mail-and-respons-fields-is-likely-not-announced-4-1-3-fdd8ce40.webp)

The login page announces its field errors through a `role="status"` element (`aab-status`). For two fields, "E-mailadres" in the security-key login and "Respons" in the e.dentifier login, **that element does not exist until the error occurs**: it is inserted together with its text ("Dit veld is verplicht.", "Dit is geen geldig e-mailadres", "Vul minimaal 5 cijfers in.").

A live region that arrives together with its message is not announced by most screen readers, so the first error on these fields is likely silent. Later changes to the same element are announced. The account and card boxes get it right: their alert container is there from the moment the form appears, and only its text changes.

#### Recommendation

Render the status element, empty, together with the field, and only write the message into it when the error occurs:

    <aab-status role="status"></aab-status>   <!-- present from the start -->

([ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)).
