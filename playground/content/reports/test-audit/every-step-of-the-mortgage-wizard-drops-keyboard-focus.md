---
title: Every step of the mortgage wizard drops keyboard focus
sc: 2.4.3
severity: High
type: Technical
sample: page-31
---

![The mortgage wizard showing the next question, "Wat is uw leeftijd?", with an empty field and the button "Ok, ga verder". Nothing on the step has keyboard focus.](/api/uploads/test-audit/every-step-of-the-mortgage-wizard-drops-keyboard-focus-2-4-3-5b90225d.webp)

In the mortgage wizard every change of view removes the control that was just used, and **focus falls to the page body** of the frame. This happens on all eleven transitions that were measured: from each of the nine questions to the next, from the last question to the result, on "Vorige", and on "Hypotheekbedrag aanpassen" / "Eigen inbreng aanpassen" and their "Opslaan".

Focus is never moved to the new question's heading, its first field or the step itself. The frame has no skip link, so after every answer a keyboard user starts again from the top of the frame and has to tab back down to the question, nine times in one calculation. A screen-reader user is not told that a new question has appeared; there is no "vraag 4 van 9" either.

The wizard can handle focus: its own dialog takes focus and returns it to "Bereken opnieuw" on Escape, and the explanation popover returns focus to its button. The same wizard is reached from the quick calculator (page-14) with "Reken verder". It is served from `hypotheken.abnamro.nl` in a frame.

#### Recommendation

After each step change, move focus to the new step's heading and put the position in it:

    <h2 tabindex="-1" id="step-heading">Vraag 4 van 9: Heeft u leningen?</h2>
    document.getElementById('step-heading').focus();

([G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59), [SCR26](https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR26)).
