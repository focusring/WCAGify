---
title: The loan-purpose question is not tied to its three answers
sc: 1.3.1
severity: Medium
type: Technical
sample: page-20
---

![The loan calculator with the question "Waarvoor wil je geld lenen?" outlined in blue, and each of its three answers, Auto, Verbouwing and Andere grote aankoop, outlined separately in dashed red.](/api/uploads/test-audit/the-loan-purpose-question-is-not-tied-to-its-three-answers-1-3-1-60f4fa33.webp)

In the loan calculator, the question **"Waarvoor wil je geld lenen?"** has three answers: Auto, Verbouwing and Andere grote aankoop. On screen they form one question. In the markup, `aab-input` wraps each radio in its own `role="radiogroup"`, so there are three groups of one radio each, and none of them has a name. The question is a `<label id="radio-5-label" for="radio-5">`, but no element with `id="radio-5"` exists, so it labels nothing. There is no `fieldset` and `legend` either.

A screen-reader user who tabs into the calculator hears "Auto, radio button" without the question, and the three unnamed groups suggest three unrelated choices of one option each. The answer matters: according to the calculator's own explanation, the purpose sets the maximum loan term. WAI-ARIA also requires a `radiogroup` to have a name, so the three nameless groups fail 4.1.2 as well.

#### Recommendation

Render one group around the three radios and name it from the visible question:

    <div role="radiogroup" aria-labelledby="radio-5-label">
      <span id="radio-5-label">Waarvoor wil je geld lenen?</span>
      <label><input type="radio" name="category-radio-button" value="car"> Auto</label>
      …
    </div>

Remove the `radiogroup` role from the per-radio wrappers. A `fieldset` with a `legend` works just as well ([H71](https://www.w3.org/WAI/WCAG22/Techniques/html/H71), [ARIA17](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA17)).
