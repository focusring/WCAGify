---
title: The income fields in the mortgage calculator have no name
sc: 4.1.2
severity: High
type: Technical
sample: page-14
---

![The mortgage calculator with two income boxes, each showing a label above a value, and an energy-label box showing the letter A.](/api/uploads/test-audit/the-income-fields-in-the-mortgage-calculator-have-no-name-4-1-2-65df21a9.webp)

In the "<span lang="nl">Hoeveel kan ik lenen voor een woning?</span>" calculator, the two income fields (`input#pv_id_5` and `input#pv_id_8`, both `role="spinbutton"` and `required`) have **no accessible name**. The accessibility tree shows two nameless spinbuttons, so a screen-reader user is asked to enter a figure with nothing to say which figure it is — and these are the only two inputs the calculation depends on.

The labels are there on screen. **"<span lang="nl">Bruto jaarinkomen</span>"** and its partner equivalent are real `<label>` elements with a `for` attribute — but that `for` points at the **PrimeVue wrapper `<span>`, not at the `<input>` it renders**. A `<label for>` can only bind to a form control, so it binds to nothing and the input is left unnamed.

The same root cause runs through the whole `aab-*` component family, in three variations:

- **page-14**, here: `for` targets the wrapper `<span>`
- **page-20**, the loan calculator: the loan-term slider "<span lang="nl">Kies de gewenste looptijd</span>" has no name. Its `<label for="term-slider-8">` binds nothing, because `aab-slider` carries that id only as a JavaScript property and never writes it to the DOM, and the `<label id="slider-label">` inside the component, which the range input points at, is empty
- **page-31**, the extended mortgage wizard: the age field's label is `<label for="question.id">` — an **unresolved template expression** shipped to production, matching no element at all; the field also has no `required` or `aria-required`, although the wizard validates it as required

In each case the label is visible but the name is empty, so speech-input users cannot reach the control by saying its label, "<span lang="nl">Bruto jaarinkomen</span>" or "<span lang="nl">Kies de gewenste looptijd</span>" (this also fails 2.5.3). One fix in the design system clears all of them.

#### Recommendation

Put the `for` on the rendered control, and give the wrapper a different id or none at all:

    <label for="calc-input-income">Bruto jaarinkomen</label>
    <span class="p-inputnumber">
      <input id="calc-input-income" role="spinbutton" required>
    </span>

Where the component cannot expose the inner id, name the control directly with `aria-labelledby` pointing at the label element ([H44](https://www.w3.org/WAI/WCAG22/Techniques/html/H44), [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16), [F68](https://www.w3.org/WAI/WCAG22/Techniques/failures/F68)).
