---
title: The search suggestions use a menu role that cannot hold headings
sc: 1.3.1
severity: Medium
type: Technical
sample: page-1
---

![The search suggestion list open under the search field, with the grey group heading "Meteen naar..." above a set of suggestion links.](/api/uploads/test-audit/the-search-suggestions-use-a-menu-role-that-cannot-hold-headings-1-3-1-b1aed955.webp)

Typing in the site search opens a suggestion list marked up as `<ul role="menu">` (`#pv_id_0_0_0_49_list`). Inside it the suggestions are grouped under visible headings such as **"Meteen naar…"** and "Zelf regelen…", which are `<h5>` elements, and the list also contains `role="separator"` items.

The `menu` role only allows `menuitem`, `menuitemcheckbox`, `menuitemradio`, `group` and `separator` as children. A heading is not among them, so assistive technology is given a structure it cannot present: the group headings are either dropped or announced out of context, and the grouping the sighted user sees is lost.

The field that opens the list also exposes no `aria-expanded`, `aria-controls` or `aria-autocomplete`, so there is nothing to tell a screen-reader user that suggestions have appeared at all.

This is the shared header search, confirmed on page-2, page-4, page-6, page-11, page-12, page-18, page-19, page-23, page-24, page-26, page-27, page-28, page-29 and page-30.

#### Recommendation

Use the combobox pattern instead of `menu`, which is meant for application menus rather than autocomplete. Mark the container `role="listbox"`, the suggestions `role="option"`, and each visible group as `role="group"` with `aria-label` carrying the group name instead of an `<h5>`. Connect it to the input:

    <input role="combobox" aria-expanded="true" aria-controls="suggestions" aria-autocomplete="list">
    <ul id="suggestions" role="listbox">
      <li role="group" aria-label="Meteen naar">
        <ul role="group"><li role="option">…</li></ul>
      </li>
    </ul>

See the [ARIA Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and [ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22).
