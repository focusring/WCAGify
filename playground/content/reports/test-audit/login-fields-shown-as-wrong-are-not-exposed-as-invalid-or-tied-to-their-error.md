---
title: Login fields shown as wrong are not exposed as invalid or tied to their error
sc: 4.1.2
severity: Medium
type: Technical
sample: page-3
---

![The e.dentifier login after leaving the fields with too few digits. The account, card and Respons boxes have orange borders, with the warnings Vul minimaal 9 cijfers in. and Vul minimaal 5 cijfers in. below them.](/api/uploads/test-audit/login-fields-shown-as-wrong-are-not-exposed-as-invalid-or-tied-to-their-error-4-1-2-45e91332.webp)

When a login field fails its check on leaving it, the page draws it as wrong: an orange border on the e.dentifier boxes, a warning icon and a message below ("<span lang="nl">Vul minimaal 9 cijfers in.</span>", "<span lang="nl">Vul minimaal 5 cijfers in.</span>", "<span lang="nl">Dit veld is verplicht.</span>"). None of that reaches assistive technology. `#account-number`, `#card-number`, `#ed2response` and `#email` never get `aria-invalid`, and none has an `aria-describedby` or `aria-errormessage` pointing at its message. The tree reads `textbox "ABN AMRO Rekeningnummer" [required]: 123`.

The component wires it the other way round: the message container (`div[role=alert]`) carries `aria-describedby="account-number"`, pointing from the message at the field, and into another shadow root, where the id cannot resolve. A screen-reader user who returns to a field hears neither that it is wrong nor why.

#### Recommendation

Put the state and the reference on the input, pointing at a message in the same shadow root, and drop the `aria-describedby` from the alert container:

    <input id="account-number" aria-invalid="true" aria-describedby="account-number-error">
    <div id="account-number-error">Vul minimaal 9 cijfers in.</div>

Remove `aria-invalid` again once the value is corrected ([ARIA21](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21), [ARIA1](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA1)).
