---
title: Market choosers and instrument tabs in the share prices work only with a mouse
sc: 2.1.1
severity: High
type: Technical
sample: page-17
---

![The share prices panel with the three AEX market choosers outlined, above the chart and the two Top 5 tables. Keyboard focus is on the first company in the Top 5 stijgers table, one Tab after the last chart period; the choosers were skipped.](/api/uploads/test-audit/market-choosers-and-instrument-tabs-in-the-share-prices-work-only-with-a-mouse-2-1-1-9416c62f.webp)

![The page of one share, Aalberts, with the row Details, Opties, Nieuws and the yellow Order opgeven button outlined, and the period chooser Laatste jaar above the chart outlined. None of them can be reached with the Tab key.](/api/uploads/test-audit/market-choosers-and-instrument-tabs-in-the-share-prices-work-only-with-a-mouse-2-1-1-4d00c41b.webp)

Several controls of the market data application are `div`s with a click handler and nothing else: no role, no `tabindex`, no key handler. Tab passes them by, `focus()` does nothing, and they cannot be operated from the keyboard:

- the three market choosers beside "Grafieken", "<span lang="nl">Top 5 stijgers</span>" and "<span lang="nl">Top 5 dalers</span>" (`div#exchange`, `#exchangeA`, `#exchangeB`) and their 13 options each;
- on the page of a share, opened from any ticker or table link: the tabs "Details", "Opties" and "Nieuws", the yellow **"<span lang="nl">Order opgeven</span>"** button, "<span lang="nl">Meer nieuws</span>" and the chart period chooser ("<span lang="nl">Laatste jaar</span>").

A keyboard user sees AEX figures only: the other twelve markets, the options and news of a share, the period of its chart and starting an order for it are all out of reach. The page of a share has four Tab stops in total. The frame's own `aria-label` promises the market choice ("<span lang="nl">Voor de tabellen en de grafiek kan zelf een beurs geselecteerd worden</span>").

The same controls also fail 4.1.2: they expose no role, name or state, so an open chooser reads as a list of loose words and nothing says which option is chosen. The loupe that runs the news search (`span#searchNewsIcon`) is an unnamed clickable `span` too. The application is the supplier's (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Use native elements, which bring keyboard support, role and state with them: a labelled `<select>` for the market and period choosers, links for the tabs, and `<button>` for "<span lang="nl">Order opgeven</span>", "<span lang="nl">Meer nieuws</span>" and the loupe (`aria-label="Zoeken in nieuws"`):

    <label for="exchangeA">Beurs</label>
    <select id="exchangeA">
      <option value="7" selected>AEX</option>
      <option value="8">AMX</option>
    </select>
    <button type="button">Toon</button>

Apply the market choice with the button, not on `change`, so arrowing through the options does not reload the frame ([H91](https://www.w3.org/WAI/WCAG22/Techniques/html/H91), [SCR35](https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR35), [G202](https://www.w3.org/WAI/WCAG22/Techniques/general/G202)).
