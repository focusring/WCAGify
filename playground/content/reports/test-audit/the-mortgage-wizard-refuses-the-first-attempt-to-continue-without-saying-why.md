---
title: The mortgage wizard refuses the first attempt to continue without saying why
sc: 3.3.1
severity: High
type: Technical
sample: page-31
---

![The income question in the mortgage wizard. The continue button is pressed with the field empty and nothing happens; pressed a second time, a red error message appears under the field.](/api/uploads/test-audit/the-mortgage-wizard-refuses-the-first-attempt-to-continue-without-saying-why-3-3-1-ce8b374d.gif)

On the two currency questions in the mortgage wizard — **"<span lang="nl">Wat is uw bruto inkomen per jaar?</span>"** and **"<span lang="nl">Hoeveel geld wilt u zelf inbrengen?</span>"** — pressing **"<span lang="nl">Ok, ga verder</span>"** with the field empty does nothing at all. No error message, no change on screen, no focus move. Only the **second** press produces "<span lang="nl">Dit veld is verplicht.</span>"

Reproduced three times across two page loads, with focus both inside and outside the field.

To anyone who cannot see the whole screen at once — and to anyone who simply expects a button to respond — the first press looks like the button is broken. A screen-reader user gets no announcement whatsoever, so there is nothing to tell them the form did not advance or why.

The inconsistency makes it harder still: the age question **does** report the error on the first press, so a user cannot learn a rule from the wizard's behaviour.

Two related problems in the same error state, on these fields and on the age field `input#age` alike (both also fail 4.1.2): the field gets a red border, a red icon and red text but carries **no `aria-invalid`**, and it is not linked to its message by `aria-describedby` or `aria-errormessage`. The message sits in an `<aab-status>` element inside the component's shadow root, so the association has to be made inside `aab-input`.

#### Recommendation

Validate on the first press, the way the age step already does, and tie the message to the field:

    <input id="currency-input" required aria-invalid="true"
           aria-describedby="currency-input-error">
    <div id="currency-input-error" role="alert">Dit veld is verplicht.</div>

Moving focus to the first field in error is also worth doing here, because the wizard shows one question at a time ([G83](https://www.w3.org/WAI/WCAG22/Techniques/general/G83), [ARIA21](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21)).
