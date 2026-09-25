---
title: "In the mortgage calculator each field's label is read after its value"
sc: 1.3.2
severity: Low
type: Technical
difficulty: Low
sample: page-14
---

![The mortgage calculator fields "Bruto jaarinkomen" with € 40.000, "Bruto jaarinkomen partner" with € 0 and "Energielabel" with A, each label shown in small text above its value inside the box. The first box is outlined in red.](/api/uploads/test-audit/in-the-mortgage-calculator-each-field-s-label-is-read-after-its-value-1-3-2-0b3804aa.webp)

In the mortgage calculator the fields **"<span lang="nl">Bruto jaarinkomen</span>"**, **"<span lang="nl">Bruto jaarinkomen partner</span>"** and **"Energielabel"** show their label at the top of the box, above the value. In the code the label is the **last** element in the box; CSS lifts it to the top (`[&>*:last-child]:emc-absolute emc-top-…`).

Assistive technology follows the code, so the reading order is value first, label second: "<span lang="nl">€ 40.000, Bruto jaarinkomen, € 0, Bruto jaarinkomen partner, A, Energielabel</span>". Because the labels are not tied to their fields either (the issues "The income fields in the mortgage calculator have no name" and "The energy-label chooser is announced by its own value instead of its purpose"), a screen-reader user meets an unexplained amount or letter and only afterwards hears what it was for.

The calculator is served from `hypotheken.abnamro.nl` in a frame.

#### Recommendation

Put each label before its field in the code and position it from there, so the visual and the reading order are the same:

    <label for="gross-income">Bruto jaarinkomen</label>
    <input id="gross-income" …>

([C27](https://www.w3.org/WAI/WCAG22/Techniques/css/C27), [G57](https://www.w3.org/WAI/WCAG22/Techniques/general/G57)).
