---
title: "The mortgage calculator's result is marked up as a broken list"
sc: 1.3.1
severity: Medium
type: Technical
difficulty: Low
sample: page-14
---

![The mortgage calculator's result "Dit is wat je maximaal kunt lenen", with "Maximale hypotheek € 170.484" and "Bruto maandbedrag € 836" outlined in red, and below them "Rente bij Annuïteit, 10 jaar rentevast 4,22%".](/api/uploads/test-audit/the-mortgage-calculator-s-result-is-marked-up-as-a-broken-list-1-3-1-06a14e28.webp)

The result the mortgage calculator exists to give, three pairs of a term and a value ("Maximale hypotheek" / "€ 170.484", "Bruto maandbedrag" / "€ 836", "Rente bij Annuïteit, 10 jaar rentevast" / "4,22%"), is built from parts that do not fit together:

    <ul class="mortgage-data__list">
      <div role="group">
        <dt role="listitem">Maximale hypotheek</dt>
        <dd role="listitem">€ 170.484</dd>
      </div>
    </ul>

The `<ul>` holds `<div>` elements instead of list items, and the `listitem` roles sit in a `group` instead of a list. axe reports both (`list` on the two lists, `aria-required-parent` on six items). The `dt`/`dd` pairing is overridden by the roles as well, so neither the list nor the link between each term and its value reaches assistive technology: a screen reader reads the answer as a loose run of text.

The calculator is the ABN AMRO mortgage application on `hypotheken.abnamro.nl`, shown in a frame on the page.

#### Recommendation

Use a description list and drop the role overrides:

    <dl class="mortgage-data__list">
      <div><dt>Maximale hypotheek</dt><dd>€ 170.484</dd></div>
      <div><dt>Bruto maandbedrag</dt><dd>€ 836</dd></div>
    </dl>

([H40](https://www.w3.org/WAI/WCAG22/Techniques/html/H40), [H48](https://www.w3.org/WAI/WCAG22/Techniques/html/H48)).
