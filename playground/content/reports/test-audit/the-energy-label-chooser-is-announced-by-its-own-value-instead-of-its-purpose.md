---
title: The energy-label chooser is announced by its own value instead of its purpose
sc: 4.1.2
severity: High
type: Technical
sample: page-14
---

![The energy-label box in the mortgage calculator, showing the label "Energielabel" above a large letter A.](/api/uploads/test-audit/the-energy-label-chooser-is-announced-by-its-own-value-instead-of-its-purpose-4-1-2-a11fc608.webp)

The energy-label chooser in the mortgage calculator is a `<span id="energy-label" role="combobox">` whose accessible name comes from `aria-label="A"` — **the currently chosen value**. A screen-reader user hears "A, combobox" and is told nothing about what the control is for. Worse, the name changes every time the value does: choose B and the control is now called "B".

The visible label "Energielabel" is a `<label for="energy-label">`, but the element it points at is a `<span>`, and a label cannot bind to a span — so the real label reaches nothing. Because the name shares no word with that label, a speech-input user who says "Energielabel" reaches nothing either (this also fails 2.5.3).

While the list is open the widget works as a combobox should: the arrow keys move `aria-activedescendant` to the highlighted option. Once it closes, the chosen value is exposed only through the name, the one place it does not belong. In the same widget, `aria-controls="pv_id_10_list"` points at an id that does **not exist** while the list is collapsed.

#### Recommendation

Give the control a name that states its purpose and expose the value separately. The straightforward fix is a native `<select>`; if the custom widget must stay, follow the combobox pattern:

    <label id="energy-label-text">Energielabel</label>
    <div role="combobox" aria-labelledby="energy-label-text"
         aria-expanded="false">A</div>

The chosen value belongs in the element's content, not in its `aria-label`, and `aria-controls` is set only while the list it names exists ([ARIA Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
