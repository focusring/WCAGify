---
title: The menu category buttons do not say whether their panel is open
sc: 4.1.2
severity: Medium
type: Technical
sample: page-1
---

![The main navigation with the "Producten" panel open below it, showing the category links.](/api/uploads/test-audit/the-main-menu-buttons-do-not-say-whether-their-panel-is-open-4-1-2-ae03e5bd.webp)

Opening a top-level menu ("Producten", "<span lang="nl">Je situatie</span>", "<span lang="nl">App en Internet Bankieren</span>") reveals a panel of **category buttons** — "<span lang="nl">Betalen & creditcards</span>", "Hypotheken", "<span lang="nl">Geld lenen</span>" and the rest. Each of those sits inside an `<li>`, and it is **the `<li>` that carries `aria-expanded`, not the `<button>` inside it**.

`aria-expanded` is not allowed on a `listitem`, so it is ignored there, and the button — the element a user actually focuses and activates — exposes no state at all. A screen-reader user pressing Enter on "Hypotheken" is not told that anything opened, and cannot tell from the button whether its category is currently showing.

The three **top-level** buttons are marked up correctly: they carry `aria-expanded` on the button itself. The defect is one level down, where page-2 counts 18 such buttons.

Automated testing misses this completely. axe's `aria-allowed-attr` rule does not flag it, because in the states where the attribute is scanned those list items sit inside an `aria-hidden` subtree.

This is the shared header, confirmed on page-1, page-2, page-4 to page-15, page-17, page-18 and page-21 to page-26.

#### Recommendation

Move the attribute onto the control:

    <li>
      <button aria-expanded="false" aria-controls="panel-hypotheken">Hypotheken</button>
    </li>

Keep it in step with the panel as it opens and closes — the same way the three top-level buttons already do it ([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16), and the [ARIA Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)).
