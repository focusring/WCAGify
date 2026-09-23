---
title: "The loan calculator's components carry ARIA that their role does not allow"
sc: 4.1.2
severity: Low
type: Technical
sample: page-20
---

![The loan calculator's result, "Dit zijn de minimale en maximale kosten", with a monthly amount (Maandbedrag) of € 208,56 under Minimaal and € 217,10 under Maximaal.](/api/uploads/test-audit/the-loan-calculator-s-components-carry-aria-that-their-role-does-not-allow-4-1-2-f875b2db.webp)

Several `aab-*` components in the loan calculator put ARIA attributes on elements that have no role, where WAI-ARIA does not allow them. axe lists them under `aria-prohibited-attr` and `aria-allowed-attr` as needing review, because it cannot know a custom element's role; checked by hand, none of these elements has one:

- **`aab-amount`**, the two monthly amounts. The element inside the component, `div.amount-wrapper`, has `aria-label="€ 209"` and `"€ 217"`, while it shows **"€ 208,56"** and **"€ 217,10"**. Chrome ignores the label today and reads the visible figures, but an assistive technology that honours `aria-label` on a generic element would announce a different monthly amount from the one on screen.
- **`aab-slider`**: the host carries `aria-valuetext="De looptijd is 5 Jaar"`, a copy of the value text that the range input inside already has.
- **`aab-info-popover`**: the host's `aria-label`, covered in the issue on the info buttons.

Attributes that are not allowed on an element's role are not reliably exposed, so what users hear depends on the browser and assistive technology.

#### Recommendation

Give each element a role that allows the attribute, or remove the attribute. For the amount, delete the `aria-label` and let the visible "€ 208,56" be read. If a different spoken form is wanted, add it as visually hidden text with the exact amount:

    <div class="amount-wrapper">€ 208,<sup>56</sup></div>

Remove `aria-valuetext` from the `aab-slider` host and keep it on the range input ([G108](https://www.w3.org/WAI/WCAG22/Techniques/general/G108)).
