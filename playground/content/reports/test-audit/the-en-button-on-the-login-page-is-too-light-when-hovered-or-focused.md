---
title: The EN button on the login page is too light when hovered or focused
sc: 1.4.3
severity: Low
type: Design
difficulty: Low
sample: page-3
---

![Two versions of the language buttons NL and EN. On the left EN is at rest in dark teal on white; on the right EN is hovered, with a pale teal fill and lighter teal text.](/api/uploads/test-audit/the-en-button-on-the-login-page-is-too-light-when-hovered-or-focused-1-4-3-1d08eed5.webp)

The language buttons at the top right of the login page change colour when the pointer is over them or they have keyboard focus. The **"EN"** button then gets a pale fill (`#edf7f7`) and lighter text (`#00857a`): **4.15:1** at 16 px, where 4.5:1 is needed. At rest it is `#00716b` on white, 5.88:1, and the current "NL" button uses `#00716b` on the same pale fill, 5.39:1.

The text is at its lightest exactly when a user is about to choose it.

#### Recommendation

Keep the darker teal for the text in the hover and focus state:

    language-toggle button:hover, language-toggle button:focus-visible { color: #00716b; }

([G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)).
