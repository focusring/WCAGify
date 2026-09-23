---
title: On narrow screens the mortgage result hides the text of its two follow-up cards
sc: 1.4.10
severity: Medium
type: Technical
sample: page-31
---

![The mortgage wizard result at full width (left) and at 288 px (right). On the left the cards "Al een woning op het oog?" and "Wilt u een gratis financiële check?" have a heading and a paragraph above their buttons; on the right only the buttons "Voeg een woning toe" and "Maak een afspraak" remain.](/api/uploads/test-audit/on-narrow-screens-the-mortgage-result-hides-the-text-of-its-two-follow-up-cards-1-4-10-2849b07e.webp)

On the result view of the mortgage wizard ("Uw hypotheek en maandbedrag"), two cards invite the next step. At full width each has a heading, a paragraph and a button:

- **"Al een woning op het oog?"**: "De keuze van de woning heeft invloed op uw hypotheek. Bij een hoger energielabel kunt u tot € 40.000 meer lenen en krijgt u een rentekorting. …", then "Voeg een woning toe";
- **"Wilt u een gratis financiële check?"**: "Tijdens een gratis en vrijblijvend oriëntatiegesprek …", then "Maak een afspraak".

When the calculator frame is 768 px wide or less, the frame sets `display: none` on both headings and both paragraphs, so on a phone and at 175 %, 200 % and 400 % zoom only the two bare buttons are left. Nothing reveals the text and it appears nowhere else. The € 40.000 energy-label fact and the "free and without obligation" framing of the appointment are lost, and the two buttons lose the headings that explain them. This also fails 1.4.4 at 200 %.

#### Recommendation

Keep the headings and paragraphs at narrow widths and let the cards stack in one column instead of hiding their text. Remove the `display: none` rules on `.mover-planned-house__title`, `.mover-planned-house__description`, `.orientation-financial-check__title` and its paragraph below the 769 px breakpoint ([C31](https://www.w3.org/WAI/WCAG22/Techniques/css/C31), [G179](https://www.w3.org/WAI/WCAG22/Techniques/general/G179)).
