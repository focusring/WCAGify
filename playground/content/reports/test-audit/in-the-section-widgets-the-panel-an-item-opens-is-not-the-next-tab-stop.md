---
title: In the section widgets the panel an item opens is not the next Tab stop
sc: 2.4.3
severity: Medium
type: Technical
sample: page-14
---

![The "Informatie over je hypotheek" widget. "Actuele hypotheekrente" is opened with Enter, then Tab moves focus down to "Korting op de hypotheekrente" and "Duurzaam wonen" before it reaches the link "Bekijk de hypotheekrente" in the panel on the right.](/api/uploads/test-audit/in-the-section-widgets-the-panel-an-item-opens-is-not-the-next-tab-stop-2-4-3-5c0e3fbc.gif)

In the desktop layout of the section widget ("Informatie over je hypotheek" on this page), choosing an item shows its panel beside the list of items. The panel is not the next Tab stop after the item that opened it: focus first walks the remaining item buttons and only then enters the panel.

Enter on **"Actuele hypotheekrente"**, then Tab: focus goes to "Korting op de hypotheekrente", then "Duurzaam wonen", and only then to "Bekijk de hypotheekrente" in the panel. On page load the same widget does the opposite (item 1, its panel's links, then item 2), so the order a keyboard user learns first is not the one they get after a choice. For a screen-reader user who has just opened an item, the content that opened is behind every other item.

The same order is on page-13 (the step foldouts), page-18 ("Verder goed om te weten"), page-19 ("Meer informatie"), page-20 ("Wanneer kun je lenen?") and page-22 (the address-change sections). In this state the widget also traps focus once it reaches the panel, which is a separate issue, "Keyboard focus gets stuck inside the expandable section panels"; the wrong state flags are "A panel widget announces itself as collapsed while its content is on screen".

#### Recommendation

Make the panel the next stop after its trigger. With disclosure buttons, render each panel in the DOM directly after its own button and position it beside the list with CSS. With a real tab set, use a roving `tabindex` on the tabs so that Tab from the selected tab goes straight into its `tabpanel`:

    <div role="tablist"><button role="tab" aria-selected="true" tabindex="0">…</button><button role="tab" aria-selected="false" tabindex="-1">…</button>…</div>
    <div role="tabpanel" tabindex="0">…</div>

Either way, do not move focus with a Tab key handler ([SCR26](https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR26), [C27](https://www.w3.org/WAI/WCAG22/Techniques/css/C27)).
