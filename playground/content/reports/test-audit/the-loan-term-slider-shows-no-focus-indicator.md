---
title: The loan-term slider shows no focus indicator
sc: 2.4.7
severity: High
type: Design
sample: page-20
---

![Tab is pressed three times in the loan calculator, moving focus onto the loan-term slider, and then the left arrow twice. The term and the monthly amounts change, but no ring or other change ever shows that the slider has focus.](/api/uploads/test-audit/the-loan-term-slider-shows-no-focus-indicator-2-4-7-5aa42672.gif)

The slider **"Kies de gewenste looptijd"** in the loan calculator (`aab-slider`, an `input type="range"` inside the component) looks exactly the same with and without focus. Reached by Tab, with `:focus-visible` true, not one pixel on screen changes. The component's stylesheet sets `outline: none` on `.slider`, and its only focus rule, `.slider:focus::-webkit-slider-thumb { border: 1px solid rgb(0, 113, 107) }`, is identical to the thumb's normal border.

A keyboard user sees the figures change when pressing the arrow keys, but cannot see that focus is on the slider, or where it went when it moved on. The `aab-slider` in the mortgage wizard (page-31) does draw a focus ring, so this is how the loan calculator's build of the component is styled.

#### Recommendation

Remove `outline: none` from `.slider`, or give the focused state a clearly visible change:

    .slider:focus-visible { outline: 2px solid #00716b; outline-offset: 4px; }

The indicator needs a contrast of at least 3:1 against its surroundings ([C45](https://www.w3.org/WAI/WCAG22/Techniques/css/C45), [G195](https://www.w3.org/WAI/WCAG22/Techniques/general/G195)).
