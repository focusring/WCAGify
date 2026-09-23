---
title: The sliders in the pension tool have no name
sc: 4.1.2
severity: High
type: Technical
sample: page-21
---

![The result step of the pension tool with six horizontal sliders, each showing a value above it but no label naming what it adjusts.](/api/uploads/test-audit/the-sliders-in-the-pension-tool-have-no-name-4-1-2-408e5dc6.webp)

The result step of the pension tool offers **six sliders** for adjusting the calculation — retirement age, starting capital, monthly contribution and so on. Each is a `<div class="slider-handle" role="slider">` carrying `aria-valuemin`, `aria-valuemax` and `aria-valuenow`, but **none of them has an `aria-label`, an `aria-labelledby` or an `aria-valuetext`**.

A screen-reader user hears "slider, 69" and nothing that says 69 is an age, or "slider, 500" with no indication that it is euros. The visible text that names each slider sits outside the widget and is not associated with it, which also fails 1.3.1 ([F111](https://www.w3.org/WAI/WCAG22/Techniques/failures/F111)). With six of them on one screen the values are indistinguishable from each other. None of the 11 `<label>` elements in the tool is tied to a control, so the read-only result rows, such as "Opgebouwd aanvullend pensioen" and its amount, are paired only by their position as well.

Each slider does have a visible label beside it ("Start pensioenuitkering", "Eenmalige inleg", "Gemiddelde inleg per maand", "Uitkeringsperiode", "Verwacht rendement", "Later starten met pensioenopbouwen"). With an empty name, that label is not part of the name either, which also fails 2.5.3 (label in name): a speech-input user who says "Eenmalige inleg" reaches nothing.

#### Recommendation

Name each slider from the text that already labels it, and give the value a unit:

    <div role="slider" aria-labelledby="label-pensioenleeftijd"
         aria-valuemin="65" aria-valuemax="74" aria-valuenow="69"
         aria-valuetext="69 years"></div>

Taking the name from the visible label also satisfies label in name ([ARIA5](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5), [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
