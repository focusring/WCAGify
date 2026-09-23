---
title: Keyboard focus gets stuck inside the expandable section panels
sc: 2.1.2
severity: High
type: Technical
sample: page-22
---

![A section of the address-change page is opened with Enter, then Tab is pressed repeatedly. Focus reaches the panel's link and stays on it through every further key press.](/api/uploads/test-audit/keyboard-focus-gets-stuck-inside-the-expandable-section-panels-2-1-2-523315ba.gif)

The expandable-section component used for "Of e-mail, telefoonnummer of naam" on this page traps keyboard focus. Open section 2, 3 or 4 and keep tabbing: focus lands on the first link inside the panel that opened and **no key moves it again**.

Tab, Shift+Tab, Escape, the four arrow keys, Home, End, PageDown and F6 were each pressed, with the focused element read after every press, and every read returned the same link. The only ways out are the mouse, reloading the page, or closing the tab. Nothing tells the user how to leave. Opening the section with the mouse and then switching to the keyboard gets stuck the same way, so this is not limited to one route.

The cause is in the component's own script: a `keydown` listener calls `preventDefault()` on Tab for the section buttons and the panel links, then moves focus itself. In the page's first state that hand-built order works, but once another section is chosen the same handler keeps sending focus back to the same link. Everything after that point on the page becomes unreachable by keyboard.

The same component traps focus the same way on six more samples, each time after an item other than the first has been chosen:

- page-13, the account-opening steps: on the link inside the open step-3 panel;
- page-14, "Informatie over je hypotheek": after "Actuele hypotheekrente", on "Bekijk de hypotheekrente";
- page-15, "Hypotheekrente uitleg": after "Rentemix", on the panel link "hypotheek";
- page-18, "Verder goed om te weten": after "Voorwaarden", on "Voorwaarden identificatiecode (PDF, 104 KB)";
- page-19, "Meer informatie": in the panels "Kosten" and "Voorwaarden, verzekeringskaart en Informatieblad";
- page-20, "Wanneer kun je lenen?": after the second item.

It appears only in the desktop layout (reproduced at 1280, 1024 and 992 px); at 640 px and below the accordion rendering does not trap.

On the travel insurance page (page-19) the trap also makes a link unreachable, which fails 2.1.1 (Keyboard) as well. The panel "Voorwaarden, verzekeringskaart en Informatieblad" holds three links. The handler sends forward focus onto the first and backward focus onto the last, and holds it there, so the middle link **"Verzekeringskaart Kortlopende Reisverzekering"** never receives focus at desktop width. Its only other copy is in the accordion rendering, which is hidden at that width, so there only a mouse opens the insurance card.

WCAG treats a keyboard trap as a failure of the whole page, not only of the widget. For this component that includes the address-change page, a step of the account-opening process, and the mortgage, app, travel insurance and personal-loan pages.

#### Recommendation

Remove the `keydown` handler that cancels Tab and let the browser handle sequential focus. A disclosure widget needs no custom Tab handling at all. Where the opened panel belongs in the Tab order is the separate issue "In the section widgets the panel an item opens is not the next Tab stop".

    // delete: element.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); … } })

If some part of the widget does need arrow-key navigation, handle only the arrow keys and leave Tab and Shift+Tab alone ([F10](https://www.w3.org/WAI/WCAG22/Techniques/failures/F10), [G21](https://www.w3.org/WAI/WCAG22/Techniques/general/G21)).
