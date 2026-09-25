---
title: Closing an explanation popover with its Close button loses keyboard focus
sc: 2.4.3
severity: Medium
type: Technical
difficulty: Low
sample: page-12
---

![The ⓘ after the word "Bankrekening" is opened from the keyboard, showing a small popover. Its close button is pressed, the popover disappears, and the next Tab press jumps to the skip link at the top of the page.](/api/uploads/test-audit/closing-an-explanation-popover-with-its-close-button-loses-keyboard-focus-2-4-3-798b6b78.gif)

The ⓘ buttons beside terms in the text open a short explanation in a popover, here for **"Bankrekening"** under "<span lang="nl">Bankrekening openen</span>". Opening it by keyboard works: focus moves onto the popover's close button. Escape also works: it closes the popover and puts focus back on the ⓘ.

But pressing Enter or Space on the popover's own **close button** closes it and leaves `document.activeElement` on `<body>`. The popover is appended at the end of the document, so the next Tab starts again at the top of the page: focus goes to "<span lang="nl">Ga naar hoofdinhoud</span>" and the page scrolls back up. The keyboard user has to Tab through the whole header and everything above the term again to get back to where they were reading, about 20 presses on this page.

The same glossary popover does this on page-8 ("Kifid") and page-25 ("Openingstijden"), and the component is also used on page-10 ("Cookies").

#### Recommendation

Let the close button do what the Escape handler already does, and return focus to the ⓘ that opened the popover:

    closeButton.addEventListener('click', () => {
      popover.hide();
      trigger.focus();
    });

See [G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59) and [F85](https://www.w3.org/WAI/WCAG22/Techniques/failures/F85).
