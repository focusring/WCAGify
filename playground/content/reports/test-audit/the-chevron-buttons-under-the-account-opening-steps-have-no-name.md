---
title: The chevron buttons under the account opening steps have no name
sc: 4.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-29
---

![The numbered steps for opening an account, each followed by a small square button showing only a chevron pointing right.](/api/uploads/test-audit/the-chevron-buttons-under-the-account-opening-steps-have-no-name-4-1-2-36fad7c2.webp)

Under the numbered steps 1, 2 and 3 for opening an account sit three **icon-only chevron buttons** (`#button-container0 > button` through `#button-container2 > button`). Each is 44 by 44 pixels and contains only an icon that is itself `aria-hidden`, with no `aria-label`, no `title` and no text.

Their accessible name is empty, so a screen-reader user meets three buttons in a row announced as nothing but "button". The buttons also expose no `aria-expanded` and no `aria-controls`, so there is no way to tell whether they open something or navigate somewhere.

They are present in all twelve states walked on this sample. This page is step 3 of the account opening process, which the audit scope names as essential functionality.

#### Recommendation

Give each button a name describing the step it belongs to, and expose its behaviour:

    <button type="button" aria-label="More about step 1: choose your account" aria-expanded="false">
      <svg aria-hidden="true">…</svg>
    </button>

If the button navigates rather than expands, use a link and drop `aria-expanded` ([ARIA6](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA6), [H91](https://www.w3.org/WAI/WCAG22/Techniques/html/H91)).
