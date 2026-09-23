---
title: The mortgage-form chooser in the rate tool does not expose the chosen form
sc: 4.1.2
severity: Medium
type: Technical
sample: page-15
---

![The mortgage-rate tool with "Overige" chosen under "Kies een hypotheekvorm" and "Woning Hypotheek" under "Kies een hypotheeksoort", both outlined in red. The sentence above the table reads "We gaan hierbij uit van een Overige hypotheekvormen Woning hypotheek met huisbankkorting".](/api/uploads/test-audit/the-mortgage-form-chooser-in-the-rate-tool-does-not-expose-the-chosen-form-4-1-2-1e0cf7d2.webp)

The **"Kies een hypotheekvorm"** chooser in the mortgage-rate tool (`div#mortgage_type_selector`, `role="button"`, with the list `ul.em-dropdown__list[role=listbox]`) exposes its list and its value incorrectly in three ways:

- The list has `aria-activedescendant="annuitair"`, an id that does not exist. The option ids are `item__mortgage_type_selector__annuitair` and so on. After another choice it becomes `"overig"` or `"aflossingsvrij"`, which match no element either. axe reports this as `aria-valid-attr-value` in every state tested.
- The button's `aria-label="Kies een hypotheekvorm"` replaces its content, and a button has no value, so the chosen form ("Annuïteiten") reaches assistive technology only as the selected option in the list. After a form is picked under "Toon alle vormen" ("Overige" in the screenshot), the list collapses back to its first six entries and **no option is selected**. The chosen form is on screen but not in the accessibility tree. The same happens for (Bank)Sparen, Spaargroei, Startzeker, Meegroei and Krediethypotheek.
- The closed list is only squeezed to `height: 0`, so it stays in the accessibility tree with its options, under a button that says `expanded=false`. Browse mode reads out a list that is not on screen.

A screen-reader user cannot reliably find out which mortgage form the rates in the table apply to.

#### Recommendation

Build the chooser as a select-only combobox with the value as its content, and hide the closed list from everyone:

    <span id="form-label">Kies een hypotheekvorm</span>
    <div role="combobox" tabindex="0" aria-labelledby="form-label"
         aria-expanded="false" aria-controls="form-list">Overige</div>
    <ul id="form-list" role="listbox" aria-labelledby="form-label" hidden>
      <li role="option" id="item__mortgage_type_selector__overig" aria-selected="true">Overige</li>
    </ul>

Keep `aria-selected="true"` on the chosen option, including the forms under "Toon alle vormen". Point `aria-activedescendant` only at ids that exist, or leave it out while DOM focus moves onto the options, as it does now ([ARIA5](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5), [APG select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/)).
