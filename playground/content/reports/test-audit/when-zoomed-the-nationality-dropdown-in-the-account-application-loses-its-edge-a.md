---
title: 'When zoomed, the nationality dropdown in the account application loses its edge and arrow'
sc: 1.4.4
severity: Medium
type: Technical
difficulty: Low
sample: page-30
---

![Step 2 of the account application at 150 % zoom. The dropdown "Wat is je nationaliteit?" showing "Nederlandse" runs past the right edge of the form, so its right border and arrow are missing.](/api/uploads/test-audit/when-zoomed-the-nationality-dropdown-in-the-account-application-loses-its-edge-a-1-4-4-e59a990c.webp)

On step 2 of the application, the dropdown **"Wat is je nationaliteit?"** is sized with `min-width: fit-content`, so it is always as wide as its longest option (545 px, "Inwoner van de Zuid-Georgia en de Zuidelijke Sandwicheilanden"). When the page is zoomed the form column becomes narrower than that, and the dropdown runs past it into the form container, which cuts it off: 38 px at 125 % zoom (1024 px), 152 px at 150 %, 188 px at 800 px and 41 px at 200 %. The same happens at phone widths from 384 px up, such as 390 px.

What is cut off is the right border and the arrow, the only things that show it is a dropdown. What is left looks like a text box reading "Nederlandse", and the rest can only be reached by scrolling the form container sideways. Without zoom (1280 px) and at 320 px it fits.

#### Recommendation

Let the dropdown follow its column instead of its content:

    .mx-dropdown__width--xlarge select { width: 100%; max-width: 25rem; min-width: 0; }

([C28](https://www.w3.org/WAI/WCAG22/Techniques/css/C28), [G146](https://www.w3.org/WAI/WCAG22/Techniques/general/G146))
