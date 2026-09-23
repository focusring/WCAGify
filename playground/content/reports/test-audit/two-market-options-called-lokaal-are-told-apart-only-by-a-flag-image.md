---
title: Two market options called Lokaal are told apart only by a flag image
sc: 1.1.1
severity: Medium
type: Technical
difficulty: Low
sample: page-17
---

![The open market chooser above the Top 5 stijgers table, listing thirteen markets each with a country flag. The option Lokaal appears twice, once with the Dutch flag and once with the American flag, and nothing else tells the two apart.](/api/uploads/test-audit/two-market-options-called-lokaal-are-told-apart-only-by-a-flag-image-1-1-1-98a130be.webp)

The market choosers in the share prices panel show each market's country as a flag, and the flag is a CSS background image (`flags_nl.gif`, `flags_us.gif`, …) with no text equivalent. For most options the name is enough (DAX, CAC 40, Nasdaq 100), but the list holds **two options named "Lokaal"**: `#menuItemA4` under the Dutch flag and `#menuItemA13` under the American one.

Anyone who does not see the flag cannot tell the Dutch local market from the American one: a screen-reader user hears "Lokaal" twice, and forced-colour modes that drop background images show two identical options. The same holds in all three choosers (chart, Top 5 stijgers, Top 5 dalers).

The choosers are part of the supplier's application (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Put the country in the option text and keep the flag as decoration:

    <div id="menuItemA4" class="menu-item menu-item-a nl">Lokaal (Nederland)</div>
    <div id="menuItemA13" class="menu-item menu-item-a us">Lokaal (Verenigde Staten)</div>

([F3](https://www.w3.org/WAI/WCAG22/Techniques/failures/F3), [C9](https://www.w3.org/WAI/WCAG22/Techniques/css/C9)).
