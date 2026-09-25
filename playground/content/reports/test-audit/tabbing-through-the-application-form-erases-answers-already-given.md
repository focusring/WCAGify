---
title: Tabbing through the application form erases answers already given
sc: 3.2.1
severity: High
type: Technical
sample: page-30
---

![A completed first step of the application form. Pressing Tab onto an already-answered question clears it, removes the question below it and removes the Volgende button.](/api/uploads/test-audit/tabbing-through-the-application-form-erases-answers-already-given-3-2-1-96f1bd1c.gif)

Complete step 1 of the application form — usage, who the account is for, student status, living in the Netherlands — and the "Volgende" button appears. Now press Tab.

When focus lands on the **already-answered "<span lang="nl">Ben je student?</span>" radio**, the page **clears that answer, removes the question below it, and removes the "Volgende" button**. No key was pressed other than Tab, and nothing was activated. Simply moving focus onto a control destroys work already done.

The next Tab then drops focus to `<body>` with a validation error showing, so the user is both back at the start of the document and looking at a form that has lost its state. That focus drop also fails 2.4.3.

WCAG 3.2.1 requires that receiving focus does not by itself cause a change of context. Removing questions and removing the submit button is exactly that. For a keyboard user, reviewing answers before submitting — the ordinary, careful thing to do — is what breaks the form.

This is the first step of opening a bank account.

#### Recommendation

Trigger the progressive disclosure on `change`, not on focus or blur:

    // bind the reveal/clear logic to the radio's change event only
    input.addEventListener('change', updateDisclosure);   // not 'focus' / 'focusin'

Never clear an answer the user has given unless they change it themselves, and never remove the submit button once the step is complete ([F52](https://www.w3.org/WAI/WCAG22/Techniques/failures/F52), [G107](https://www.w3.org/WAI/WCAG22/Techniques/general/G107)).
