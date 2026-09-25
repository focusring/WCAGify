---
title: The placeholder that labels the search field is too faint to read
sc: 1.4.3
severity: Medium
type: Design
difficulty: Low
sample: page-1
---

![The search field in the greeting panel, with the grey placeholder text "Zoeken naar..." inside a light grey box.](/api/uploads/test-audit/the-placeholder-that-labels-the-search-field-is-too-faint-to-read-1-4-3-4c404b30.webp)

The search field's placeholder is drawn in `#9ca3af` on the field's own grey fill:

- **"<span lang="nl">Zoeken naar…</span>"** in the greeting panel: `#9ca3af` on `#e9e9e9` = **2.09:1**
- **"<span lang="nl">Waar ben je naar op zoek?</span>"** in the open header bar: `#9ca3af` on `#dedede` = **1.89:1**
- the greeting panel field at 640 and 320 pixels: also **1.89:1**

At 16 pixels and regular weight, 4.5:1 is required. These are less than half of it.

This matters more than a faint placeholder usually would, because **the field has no visible label**. The placeholder is the only thing that says what the field is for, so it is not decorative hint text — it carries the field's purpose, and it is the least readable text in the component.

The search bar is in the header of every page in the audit.

#### Recommendation

Give the field a real visible label and let the placeholder be genuinely optional:

    <label for="search-input">Zoeken</label>
    <input id="search-input" type="search" placeholder="Bijvoorbeeld: hypotheek">

If the design cannot carry a visible label, darken the placeholder to at least `#6b7280` on `#e9e9e9` (4.6:1) and `#67707c` on `#dedede` (4.5:1) ([G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)).

A permanently visible label is the better answer: placeholder text disappears the moment someone starts typing, which is exactly when they may want to check what the field was for.
