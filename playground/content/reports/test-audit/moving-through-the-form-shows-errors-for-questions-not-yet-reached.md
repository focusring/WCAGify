---
title: Moving through the form shows errors for questions not yet reached
sc: 3.3.1
severity: High
type: Technical
sample: page-30
---

![The application form with a red error message "Je hebt niets ingevuld" under a question the user has not answered yet.](/api/uploads/test-audit/moving-through-the-form-shows-errors-for-questions-not-yet-reached-3-3-1-fce861a7.webp)

Validation on this form fires on **blur**. Tabbing from one radio group to the next — without answering, because the user is still reading — inserts `div.alert.alert-danger[role=alert]` reading **"Je hebt niets ingevuld…"** under the group just left.

Tabbing forward is not a decision not to answer. A keyboard user moving through the form to see what it asks before committing is told, question by question, that they have done something wrong. A screen-reader user gets the error announced immediately, because it is a `role="alert"`.

The effect compounds: by the time someone has looked at all four questions in step 1, the page is showing several errors for questions they fully intend to answer.

WCAG 3.3.1 is about identifying errors that exist. An unanswered question the user has not yet reached is not an error.

#### Recommendation

Validate a required field when the user leaves it **having interacted with it**, or when they submit — not on blur alone:

    // validate on submit, or on blur only if the control has been touched
    if (control.dataset.touched) validate(control);

Marking each group as required up front, so the expectation is clear before the user reaches it, removes the need for early errors altogether ([G83](https://www.w3.org/WAI/WCAG22/Techniques/general/G83), [G85](https://www.w3.org/WAI/WCAG22/Techniques/general/G85)).
