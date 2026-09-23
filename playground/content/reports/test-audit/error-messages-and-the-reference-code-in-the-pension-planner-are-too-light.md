---
title: Error messages and the reference code in the pension planner are too light
sc: 1.4.3
severity: Medium
type: Design
difficulty: Low
sample: page-21
---

![The pension planner's age field outlined in red, with the red error message "Vul een leeftijd tussen de 18 en 70 jaar in." below it.](/api/uploads/test-audit/error-messages-and-the-reference-code-in-the-pension-planner-are-too-light-1-4-3-591bf8eb.webp)

![The reference code "id.51b3bdfd9095" in small light grey text on white at the foot of the planner.](/api/uploads/test-audit/error-messages-and-the-reference-code-in-the-pension-planner-are-too-light-1-4-3-c450f5ee.webp)

Two kinds of text in the Webbridge pension planner fall below the required 4.5:1 against white:

- the **error messages** under the fields, such as "Vul een leeftijd tussen de 18 en 70 jaar in." and "Vul een bedrag in.", are `#db402c` at 16 px: **4.39:1**. They appear when "Reken verder" refuses the input, which is exactly when the user needs to read them;
- the **reference code** "id.51b3bdfd9095" at the foot of the first step is `#999999` at 11 px: **2.85:1**. It is the code a user would quote when asking support about their calculation.

axe reports both (`color-contrast`). The planner is supplied by Webbridge and shown in a frame on the page.

#### Recommendation

Darken both colours:

    .tkm-error-text { color: #c8301c; }   /* 5.4:1 on white */
    p.copyright     { color: #767676; }   /* 4.54:1 on white */

([G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)).
