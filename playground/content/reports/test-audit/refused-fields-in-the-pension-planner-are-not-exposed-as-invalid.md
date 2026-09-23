---
title: Refused fields in the pension planner are not exposed as invalid
sc: 4.1.2
severity: Medium
type: Technical
sample: page-21
---

![Step 1 of the pension planner after a refused submit. The age field (75) and the monthly deposit field (0) have red borders, a red exclamation icon and a red message below each.](/api/uploads/test-audit/refused-fields-in-the-pension-planner-are-not-exposed-as-invalid-4-1-2-da719bce.webp)

When the pension planner refuses a value, it draws the field as wrong: a red border (`rgb(219,64,44)` instead of grey), a red "!" icon and red message text below it. None of that reaches assistive technology. `#leeftijd` and `#inlegMnd` carry no `aria-invalid` and no `aria-describedby` or `aria-errormessage`, and the message (`div.tkm-error-text`) is a plain `div` tied to nothing. The tree reads `textbox "Je huidige leeftijd": 75`, with no invalid state and no description.

The page also comes back with focus on `<body>`, so nothing leads a screen-reader user to the messages. Tabbing through the form, they hear the fields and their values without hearing which ones are wrong or why.

The planner is Webbridge's application (`rekentools.webbridge.nl`), shown inside the page.

#### Recommendation

When the form is shown again, mark each refused input and point it at its message:

    <input id="leeftijd" aria-invalid="true" aria-describedby="leeftijd-error">
    <div class="tkm-error-text" id="leeftijd-error">Vul een leeftijd tussen de 18 en 70 jaar in.</div>

Move focus to the first refused field when the page returns ([ARIA21](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21), [ARIA1](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA1)).
