---
title: The pension planner reveals its age and deposit rules only after refusing input
sc: 3.3.2
severity: Low
type: Content
difficulty: Low
sample: page-21
---

![Step 1 of the pension planner as a visitor first meets it, with the fields Je huidige leeftijd, Eenmalige inleg and Je maandelijkse inleg. No range or minimum is shown anywhere.](/api/uploads/test-audit/the-pension-planner-reveals-its-age-and-deposit-rules-only-after-refusing-input-3-3-2-8fecbade.webp)

![The same step after Reken verder with age 75 and a monthly deposit of 0. Only now does the age field say Vul een leeftijd tussen de 18 en 70 jaar in.; the deposit field says Vul een bedrag in.](/api/uploads/test-audit/the-pension-planner-reveals-its-age-and-deposit-rules-only-after-refusing-input-3-3-2-3a78de65.webp)

Step 1 of the pension planner enforces two rules that nothing tells the visitor before they submit:

- **"Je huidige leeftijd"** must be 18 to 70 (17 and 71 are refused);
- **"Je maandelijkse inleg"** must be at least € 1 (0 is refused with "Vul een bedrag in.").

There is no hint beside either field and no instruction above the form. The age field has no help, and the monthly deposit's help says only "Hoeveel geld wil je gemiddeld per maand investeren in je pensioen?". The age range first appears in the error message; the minimum deposit appears nowhere. A visitor who wants to see the effect of a one-time deposit alone is refused without being told why.

The planner is Webbridge's application (`rekentools.webbridge.nl`), shown inside the page.

#### Recommendation

State the rules in the labels, where everyone meets them before typing:

    <label for="leeftijd">Je huidige leeftijd (18 tot en met 70 jaar)</label>
    <label for="inlegMnd">Je maandelijkse inleg (minimaal € 1)</label>

Or accept 0 as a monthly deposit ([G89](https://www.w3.org/WAI/WCAG22/Techniques/general/G89), [G184](https://www.w3.org/WAI/WCAG22/Techniques/general/G184)).
