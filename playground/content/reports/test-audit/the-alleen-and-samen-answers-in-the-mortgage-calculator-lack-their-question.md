---
title: The Alleen and Samen answers in the mortgage calculator lack their question
sc: 1.3.1
severity: Medium
type: Technical
difficulty: Low
sample: page-14
---

![The mortgage calculator with the question "Koop je alleen of samen?" above the radio buttons "Alleen" and "Samen", Samen chosen.](/api/uploads/test-audit/the-alleen-and-samen-answers-in-the-mortgage-calculator-lack-their-question-1-3-1-3cd694ac.webp)

In the mortgage calculator the question **"Koop je alleen of samen?"** is answered with the radio buttons "Alleen" and "Samen". On screen the question stands above them; in the code the two radios sit in a plain `<ul>` with no `<fieldset>` and `<legend>`, no `role="radiogroup"` and no `aria-labelledby` pointing at the question (an `h4`).

A screen reader announces "Alleen, radio button, 1 of 2" without the question, so a user who tabs into the calculator does not know what "Alleen" answers. The answer changes the calculation: "Samen" adds the partner's income field.

The calculator is served from `hypotheken.abnamro.nl` in a frame. The personal-loan calculator has the same kind of defect in its own component ("The loan purpose question is not tied to its three answers").

#### Recommendation

Group the radios under the question:

    <fieldset>
      <legend>Koop je alleen of samen?</legend>
      <label><input type="radio" name="is-joint" id="is-joint-false"> Alleen</label>
      <label><input type="radio" name="is-joint" id="is-joint-true"> Samen</label>
    </fieldset>

Or keep the list and give it `role="radiogroup"` with `aria-labelledby` set to the question's `id` ([H71](https://www.w3.org/WAI/WCAG22/Techniques/html/H71), [ARIA17](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA17)).
