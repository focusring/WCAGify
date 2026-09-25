---
title: Tabbing forward never gets past the price ticker in the share prices panel
sc: 2.4.3
severity: High
type: Technical
sample: page-17
---

![Tab is pressed again and again in the share prices panel. The focus outline moves from one company in the scrolling price ticker to the next (Prosus, SBM Offshore, Relx, Unilever) and never reaches the Koersoverzicht links or the chart below the ticker.](/api/uploads/test-audit/tabbing-forward-never-gets-past-the-price-ticker-in-the-share-prices-panel-2-4-3-f1a54ba5.gif)

Every company in the price ticker at the top of the market data panel (`#tickercontainer`) is a link and a Tab stop. When one of them gets focus the ticker scrolls on, its script takes the item that has left on the left out of the DOM and appends it again, and the focused link goes with it: focus falls to the frame's `<body>`. The next Tab lands on the next ticker item, the ticker is circular, and **the cycle never ends**. In 80 Tab presses inside the frame focus dropped to `<body>` 15 times and never left the ticker. From the host page, 109 presses after entering the frame never left it either. Escape, the arrow keys, End and PageDown do not move focus past it.

Everything after the ticker is therefore out of forward reach: the Koersoverzicht links, the chart periods, the Top 5 tables, the whole "<span lang="nl">Financieel nieuws</span>" block, and all 56 stops of the host page after the frame, footer and "Cookie-instellingen" included. Only Shift+Tab from the end of the page gets there, which a keyboard user has to guess.

The focus loss happens without any key press. In a logged run "AEGON" received focus and lost it 734 ms later, when the ticker re-inserted its items, which is also a change of context on focus (3.2.1). This is a different defect from the filed issue that the ticker cannot be paused. The market data panel is the supplier's application (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Never remove a focused node from the DOM. Pause the ticker while focus is inside it, and move the tape with a CSS `transform` instead of `detach()`/`append()`, so the focused link keeps its place:

    $('#tickercontainer')
      .on('focusin', () => ticker.pause())
      .on('focusout', () => ticker.resume());

Tab then walks the ticker once and continues to the content below it ([F55](https://www.w3.org/WAI/WCAG22/Techniques/failures/F55), [G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59)).
