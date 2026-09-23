---
title: The list of flexible-employment conditions in the mortgage wizard is typed bullets
sc: 1.3.1
severity: Low
type: Content
difficulty: Low
sample: page-31
---

![The mortgage wizard step "Wat is uw werksituatie?" with the help text opened; under "U heeft een flexibele arbeidsrelatie als u:" three lines start with a bullet character, outlined in red.](/api/uploads/test-audit/the-list-of-flexible-employment-conditions-in-the-mortgage-wizard-is-typed-bulle-1-3-1-4eb068ee.webp)

In the mortgage wizard, the step **"Wat is uw werksituatie?"** has a help text "Waarom willen jullie mijn werksituatie weten?". Opened, it shows three conditions under "U heeft een flexibele arbeidsrelatie als u:", drawn as a bulleted list. They are typed text in one `div`, with bullet characters and line breaks:

    <div class="assist__subtext">• Een payrollconstructie heeft <br> •  Een oproep- of een nulurencontract heeft <br> • In de afgelopen jaren vaker van baan bent veranderd</div>

Screen readers announce no list and no number of items, and some read the bullets out as characters. The help text of the step "Heeft u leningen?" in the same wizard uses a real list, so this one was typed by hand.

#### Recommendation

Mark the three conditions up as a list in the help content, as the loans help text already does:

    <ul><li>Een payrollconstructie heeft</li><li>Een oproep- of een nulurencontract heeft</li><li>In de afgelopen jaren vaker van baan bent veranderd</li></ul>

([H48](https://www.w3.org/WAI/WCAG22/Techniques/html/H48))
