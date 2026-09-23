---
title: Choosing an answer in the mortgage wizard moves on to the next question at once
sc: 3.2.2
severity: Medium
type: Technical
sample: page-31
---

![The mortgage wizard question "Koopt u alleen of samen?" with the answers "Ik koop alleen" and "We kopen samen". An answer is chosen and the question is at once replaced by "Wat is uw leeftijd?", with the progress bar moving from 2 % to 8 %.](/api/uploads/test-audit/choosing-an-answer-in-the-mortgage-wizard-moves-on-to-the-next-question-at-once-3-2-2-cb8f488c.gif)

Five questions of the mortgage wizard are answered with radio cards: "Koopt u alleen of samen?", "Heeft u een studieschuld?", "Heeft u leningen?", "Betaalt u alimentatie?" and "Heeft u al een koopwoning?". **Choosing an answer replaces the whole step**, heading, answers and progress bar, with the next question. There is no button to confirm, and nothing on the start screen or in the steps says that choosing moves on. The "Voeg een woning toe" branch after the result does the same on "Wat is het type woning?" and "Wilt u nog verbouwen?".

The rest of the wizard works differently: the age, income, own-funds and work-situation steps each have an "Ok, ga verder" button. A user who picks the wrong card, or is still comparing the two, is already on the next question. For a screen-reader user nothing is announced and focus does not follow, so the change is easy to miss (the focus loss is the separate issue "Every step of the mortgage wizard drops keyboard focus").

The wizard is the ABN AMRO mortgage application on `hypotheken.abnamro.nl`, shown in a frame on the page.

#### Recommendation

Give the radio steps the same "Ok, ga verder" button as the other steps, so choosing an answer only selects it:

    <fieldset><legend>Koopt u alleen of samen?</legend>…radio cards…</fieldset>
    <button type="submit">Ok, ga verder</button>

If the automatic step must stay, say so before the first question ("Na elke keuze gaat u direct naar de volgende vraag") ([H84](https://www.w3.org/WAI/WCAG22/Techniques/html/H84), [G13](https://www.w3.org/WAI/WCAG22/Techniques/general/G13)).
