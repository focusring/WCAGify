---
title: 'The energy-label dropdown selects an option on mouse press, not on release'
sc: 2.5.2
severity: Low
type: Technical
sample: page-14
---

![The "Energielabel" dropdown in the mortgage calculator is opened and the mouse button is pressed on A+. The list closes at once and A+ is chosen. The pointer then slides away and is released elsewhere, and A+ stays selected.](/api/uploads/test-audit/the-energy-label-dropdown-selects-an-option-on-mouse-press-not-on-release-2-5-2-f7ab8c6d.gif)

In the mortgage calculator, the **"Energielabel"** dropdown (PrimeVue Select) selects an option the moment the mouse button goes down on it. While the button is still held, the list closes, the new label is shown and the result recalculates (Maximale hypotheek € 170.484 becomes € 180.484). Moving the pointer off the option before releasing does not cancel the choice, and there is no undo. The only way back is to reopen the list and pick the previous label, which the user has to remember.

Mouse and pen users who press the wrong option, for example because of a tremor, cannot take it back by sliding away before they let go. Touch users are not affected, because a finger tap fires the mouse events only after the touch ends.

#### Recommendation

Select the option on `click`, the up-event, instead of on `mousedown`. Keep a `mousedown` handler only to call `preventDefault()`, so the dropdown keeps focus ([G212](https://www.w3.org/WAI/WCAG22/Techniques/general/G212), [F101](https://www.w3.org/WAI/WCAG22/Techniques/failures/F101)).
