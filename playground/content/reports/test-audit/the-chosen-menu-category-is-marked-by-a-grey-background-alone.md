---
title: The chosen item in menus and section lists is marked by a grey background alone
sc: 1.4.11
severity: Medium
type: Design
sample: page-21
---

![An open main-menu panel with seven category buttons down the left; one has a light grey background and the rest are white.](/api/uploads/test-audit/the-chosen-menu-category-is-marked-by-a-grey-background-alone-4-1-2-562e626a.webp)

Opening a main-menu panel shows seven category buttons down the left ("<span lang="nl">Betalen & creditcards</span>", "Hypotheken" … "Pensioen"). Choosing one loads its links into the panel beside it, and the chosen button turns `#dedede` (`rgb(222,222,222)`) while the other six stay white.

That grey is the **only** mark of the chosen category, and against the white panel it reaches **1.35:1**. Text colour, weight, border and arrow do not change, while a visual state indicator needs 3:1 (1.4.11), so many low-vision users cannot see which category is showing. The button does not expose the state to assistive technology either: its `aria-expanded` sits on the surrounding `<li>`, where it is ignored (reported as "The menu category buttons do not say whether their panel is open").

The same grey fill, one design token, is the only mark of the chosen item in every component that switches content with a list of buttons:

- the topic chooser on the service pages (page-4, page-23)
- the numbered steps of "<span lang="nl">Hoe open ik een betaalrekening?</span>" (page-13)
- the section switchers beside a content panel: "<span lang="nl">Informatie over je hypotheek</span>" (page-14), "<span lang="nl">Hypotheekrente uitleg</span>" (page-15), "<span lang="nl">Verder goed om te weten</span>" (page-18), "<span lang="nl">Meer informatie</span>" (page-19) and "<span lang="nl">Of e-mail, telefoonnummer of naam</span>" (page-22)
- the "<span lang="nl">Meer informatie</span>" list on page-9

In most of them the panel heading repeats the chosen item's name, which helps, but the item itself cannot be picked out. Several also show a panel on first load with no item marked at all. The mega-menu is in the shared header, so it is on every page.

#### Recommendation

Change the selected-state token once, so that every component gets a cue of at least 3:1 against white, for example a bar on the leading edge on top of the grey fill:

    /* the selected state, wherever the #dedede fill is applied today */
    .is-selected {
      background-color: #dedede;
      box-shadow: inset 4px 0 0 #004c4c;   /* 9.82:1 on white */
    }

Mark the first item the same way when a panel is shown on load, and keep a programmatic state on the button in step with the visual one (`aria-expanded` or `aria-current`) ([ARIA5](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5), [Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)).
