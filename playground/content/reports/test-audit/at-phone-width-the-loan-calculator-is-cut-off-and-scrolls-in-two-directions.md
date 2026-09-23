---
title: At phone width the loan calculator is cut off and scrolls in two directions
sc: 1.4.10
severity: High
type: Technical
sample: page-20
---

![The loan calculator "Wat kost mijn lening?" at 320 pixels wide. The amount field is cut off at the right edge after "0,", the slider runs off the edge and its end label reads only "Ma".](/api/uploads/test-audit/at-phone-width-the-loan-calculator-is-cut-off-and-scrolls-in-two-directions-1-4-10-d9d9d674.webp)

![The same calculator at 320 pixels with a result. The result card "Dit zijn de minimale en maximale kosten" is cut off at the bottom of the frame and the labels on the left edge are clipped.](/api/uploads/test-audit/at-phone-width-the-loan-calculator-is-cut-off-and-scrolls-in-two-directions-1-4-10-158d3470.webp)

The personal-loan calculator is shown in a frame (`iframe#tcm-267699-iframe`). The page around it reflows at 320 CSS pixels, but the calculator does not. Its fields, slider and button have fixed widths of 300 pixels (`.slider-container { min-width: 300px }`), plus padding, so inside the 288-pixel frame the content is 332 pixels wide:

- the amount field shows only "0,", the slider's end label "Max. 8" reads "Ma" and the slider itself runs off the right edge;
- error messages are cut off as well ("Het maximale bedrag i…");
- the frame has a fixed height of 828 pixels, while the result needs 1034, so the yellow "Vrijblijvende offerte aanvragen" button and the disclaimer fall below the bottom of the frame.

To use the calculator at this width, a user has to scroll the frame both sideways and down, inside a page that scrolls too. For people who enlarge text to 400 % or use a phone, the amount they type and the result they came for are partly out of view.

The same `aab-slider` rule cuts off the mortgage wizard (page-31). In "Hypotheekbedrag aanpassen" at 320 px the slider and its label "Max. € 194.149" end 30 px past the edge of the 288 px frame, so the handle at its maximum is cut off and the label reads "Max. € 194". The amount box beside it still works.

#### Recommendation

Let the calculator's controls fill the available width, and let the frame take the height of its content:

    aab-input, aab-slider, .submit { width: 100%; }
    .slider-container { min-width: 0; }

Remove `height="828"` from the iframe and size it from the content, for example with a `ResizeObserver` in the frame that posts its height to the page ([C32](https://www.w3.org/WAI/WCAG22/Techniques/css/C32), [C31](https://www.w3.org/WAI/WCAG22/Techniques/css/C31)).
