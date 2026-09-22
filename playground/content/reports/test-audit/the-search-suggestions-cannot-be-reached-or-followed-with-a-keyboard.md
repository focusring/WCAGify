---
title: The search suggestions cannot be reached or followed with a keyboard
sc: 2.4.3
severity: High
type: Technical
sample: page-5
---

![The header search with a term typed in, showing a suggestion list with a group of "Meteen naar..." links to product pages below the search matches.](/api/uploads/test-audit/the-search-suggestions-cannot-be-reached-or-followed-with-a-keyboard-2-4-3-f610ac69.webp)

Type in the header search and a suggestion list opens. It offers two kinds of entry: search terms, and a **"Meteen naar…"** group of real links straight to product pages. A keyboard user can reach neither.

The six suggestion links carry **`tabindex="1"`**. A positive `tabindex` promotes an element ahead of everything else in the tab order, and here it does not even achieve that: pressing Tab from the search field goes to the unnamed clear button, then to the menu container, and then **out of the widget — which closes it**. Shift+Tab does not reach them either. The suggestions are never focused, in either direction.

Arrow keys move a visible highlight through the list and rewrite the field, which looks like it works. But pressing Enter on a highlighted **"Meteen naar…"** entry **submits a search for that entry's title** instead of following its link. Choosing "Hypotheekrente in september 2026" lands on `/nl/prive/zoeken/?q=Hypotheekrente+in+september+2026…` rather than on the rate page itself.

So a mouse user gets a shortcut straight to the page they want, and a keyboard user gets a search results page and has to start again.

This is the shared header search, present on every page in the audit.

#### Recommendation

Remove the positive `tabindex` — it is not needed and it disturbs the order of the whole page — and implement the list as a combobox, where the field keeps focus and the active option is tracked with `aria-activedescendant`:

    <input role="combobox" aria-expanded="true" aria-controls="suggestions"
           aria-autocomplete="list" aria-activedescendant="suggestion-3">
    <ul id="suggestions" role="listbox">
      <li id="suggestion-3" role="option" aria-selected="true">…</li>
    </ul>

Enter on an option must do what clicking it does: follow the link for a "Meteen naar…" entry, and search for a search term ([F44](https://www.w3.org/WAI/WCAG22/Techniques/failures/F44), [ARIA Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).
