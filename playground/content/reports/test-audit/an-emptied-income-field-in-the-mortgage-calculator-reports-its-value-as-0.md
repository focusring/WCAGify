---
title: An emptied income field in the mortgage calculator reports its value as 0
sc: 4.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-14
---

![The mortgage calculator with the "Bruto jaarinkomen" field emptied and outlined in red, the error "Bruto jaarinkomen is verplicht" under it, and the result panel beside it still showing a maximum mortgage.](/api/uploads/test-audit/an-emptied-income-field-in-the-mortgage-calculator-reports-its-value-as-0-4-1-2-d151e861.webp)

When one of the two income fields in the mortgage calculator (`input#pv_id_5` and `input#pv_id_8`, a PrimeVue InputNumber with `role="spinbutton"`) is emptied, the component writes `aria-valuenow="null"`, the literal text "null". That is not a valid value for the property: axe reports it as `aria-valid-attr-value` (critical). The accessibility tree then gives the field the value 0.

A screen-reader user hears "0" in a field that is visibly empty and that the error under it says must be filled in. Emptying the field is the normal way to type a different income, so anyone who corrects an amount runs into this.

#### Recommendation

Remove `aria-valuenow` while the field has no value, instead of writing the empty value into it:

    if (value == null) input.removeAttribute('aria-valuenow')
    else input.setAttribute('aria-valuenow', String(value))

([ARIA5](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5), [WAI-ARIA spinbutton](https://www.w3.org/TR/wai-aria-1.2/#spinbutton))
