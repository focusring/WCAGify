---
title: Screen readers are not told which chart period or share tab is chosen
sc: 4.1.2
severity: Medium
type: Technical
sample: page-17
---

![The chart periods Dag, 1 Maand, 3 Maanden, 1 Jaar, 2 Jaar, 5 Jaar and 10 Jaar as a row of underlined links, with 1 Maand in bold as the chosen one.](/api/uploads/test-audit/screen-readers-are-not-told-which-chart-period-or-share-tab-is-chosen-4-1-2-b7f3c838.webp)

![The page of one share with the tabs Details, Opties and Nieuws; Details, the open tab, is shown only by an underline.](/api/uploads/test-audit/screen-readers-are-not-told-which-chart-period-or-share-tab-is-chosen-4-1-2-09d8dd9c.webp)

Under the price chart the period links "Dag" to "10 Jaar" show the chosen period in bold (`class="selected"`), and nothing more: there is no `aria-pressed`, `aria-current` or `aria-selected`, and the accessibility tree reads `link "1 Maand"` exactly like the other six. The periods are `href="#"` links that act as toggle buttons.

On the page of a share, the open tab ("Details", "Opties", "Nieuws") is marked only by an underline (`.activeTab`), again with no state in the markup.

A screen-reader user cannot tell which period the chart is showing or which view of the share is open, while a sighted user reads it at a glance. The chart and tabs are part of the supplier's application (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Make the periods buttons in a named group and expose the chosen one:

    <div role="group" aria-label="Periode">
      <button type="button" aria-pressed="false">Dag</button>
      <button type="button" aria-pressed="true">1 Maand</button>
    </div>

For the tabs, once they are links (see the issue on the mouse-only controls), set `aria-current="page"` on the open one ([ARIA5](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5)).
