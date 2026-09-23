---
title: 'Tabbing onto "Toon minder periodes" collapses the rate table and loses focus'
sc: 3.2.1
severity: High
type: Technical
sample: page-15
---

![The expanded rate table with 14 periods. Keyboard focus is on the info icon beside "6 maanden" in the last row, and the "Toon minder periodes" bar sits below it.](/api/uploads/test-audit/tabbing-onto-toon-minder-periodes-collapses-the-rate-table-and-loses-focus-3-2-1-fc7a9321.webp)

![One Tab later. The table has collapsed back to six periods, the bar now reads "Toon alle periodes", and nothing on screen shows focus.](/api/uploads/test-audit/tabbing-onto-toon-minder-periodes-collapses-the-rate-table-and-loses-focus-3-2-1-3fb7653c.webp)

Expand the rate table in the mortgage-rate tool with "Toon alle periodes" and keep pressing Tab. When focus reaches the button, now labelled **"Toon minder periodes"**, the table collapses **as soon as the button receives focus**. No key is pressed, yet the rows drop from 14 to 6 and focus falls to the document body. A scripted `focus()` alone has the same effect, so the collapse is tied to focus, not to activation.

The next Tab expands the table again and puts focus on it, and the cycle repeats: table, six info buttons, collapse, expand. On the host page, 20 Tab presses after expanding never left the tool, so the video, the explanations, the FAQ and the footer cannot be reached with forward Tab. Only Shift+Tab gets out. It reproduced in 7 of 9 runs (it depends on timing). When the button does keep focus, Enter collapses the table and also drops focus to the body.

Besides the change on focus, this breaks the focus order (2.4.3) and keeps keyboard users from moving on through the page (2.1.1).

#### Recommendation

Remove the focus handler that collapses the table. Toggle only when the button is activated, and keep one persistent button whose label and state change, so focus stays on it:

    <button type="button" id="table-extend-btn" aria-expanded="true"
            aria-controls="primaryTable">Toon minder periodes</button>

    button.addEventListener('click', toggleTable) // not on 'focus' or 'focusin'

([G107](https://www.w3.org/WAI/WCAG22/Techniques/general/G107), [F55](https://www.w3.org/WAI/WCAG22/Techniques/failures/F55))
