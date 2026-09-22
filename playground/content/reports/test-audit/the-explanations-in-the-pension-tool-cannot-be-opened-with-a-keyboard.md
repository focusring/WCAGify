---
title: The explanations in the pension tool cannot be opened with a keyboard
sc: 2.1.1
severity: High
type: Technical
sample: page-21
---

![Tabbing through the pension tool's result step. Focus moves from field to field and past every information icon without ever stopping on one.](/api/uploads/test-audit/the-explanations-in-the-pension-tool-cannot-be-opened-with-a-keyboard-2-1-1-55f2f4b1.gif)

Every figure the pension tool asks for and every figure it returns has an information icon beside it that opens an explanation. **None of the eleven can be reached or operated with a keyboard.**

Each one is `<a type="button" class="btn">` with **no `href`, no `role` and no `tabindex`**, carrying nothing but a jQuery click handler. Two independent tab walks — one from the page, one in the tool's own document, both directions — agree: **step 1 has exactly four tab stops and step 2 exactly eight, and no information icon is among them.** Calling `.focus()` on one does not even focus it.

There is no alternative route. The explanation panels are `display:none` until the icon is clicked, so their text is in no accessibility tree and cannot be read another way. A keyboard user is simply shut out of every explanation in the tool — including the nine on the result step, which explain what the projected figures mean.

A related problem in the same component: when a panel **is** opened with a mouse and then closed with its "Klik om te sluiten" button, focus is dropped to the page body instead of returning to the icon.

The tool is supplied by an outside party on `rekentools.webbridge.nl` and shown inside this page. The same icons also fail 1.1.1, because they carry no text alternative — that is filed separately, and both are fixed by the same change.

#### Recommendation

Use a real `<button>`. It gives the control a name, a role and a place in the tab order at once, and it responds to Enter and Space without any extra script:

    <button type="button" class="btn tkm-table-help-btn"
            aria-expanded="false" aria-controls="help-pensioenleeftijd"
            aria-label="Wat is pensioenleeftijd?">
      <img src="/abnamro/img/sy-others-info.svg" alt="">
    </button>

Return focus to that button when the panel closes ([F42](https://www.w3.org/WAI/WCAG22/Techniques/failures/F42), [G202](https://www.w3.org/WAI/WCAG22/Techniques/general/G202), [F85](https://www.w3.org/WAI/WCAG22/Techniques/failures/F85)).
