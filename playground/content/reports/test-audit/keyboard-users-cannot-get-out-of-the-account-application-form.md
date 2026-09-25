---
title: Keyboard users cannot get out of the account application form
sc: 2.1.2
severity: High
type: Technical
sample: page-30
---

![Tab pressed repeatedly on the account application page. Focus cycles between the same three controls indefinitely and never reaches the header or the footer.](/api/uploads/test-audit/keyboard-users-cannot-get-out-of-the-account-application-form-2-1-2-82c05762.gif)

The account application form traps keyboard focus. `div.mx-dataview-content` cancels the browser's own Tab handling and wraps focus back inside itself, so **Tab and Shift+Tab cycle through the form's controls forever**.

On first load that cycle is **three stops** — the privacy link, the radio "Prive" and the radio "<span lang="nl">Voor mezelf</span>" — repeating endlessly in both directions. **Escape does not release it. F6 does not release it.** At step 2 the loop simply grows to that step's 16 stops; it never opens.

It is worse than a trap a user can back out of, because **the page moves focus into the container by itself after load**. Someone who reloads the page is placed inside the trap before they have pressed anything, and from there the header, the search, the breadcrumb and the entire footer are unreachable. There is no way to leave except closing the tab or using browser chrome.

This is WCAG's non-interference requirement: a keyboard trap fails the page as a whole, not just the component. It sits on the first step of opening a bank account — the process the audit scope names as essential functionality.

Verified on a fresh browser profile after the first observation.

#### Recommendation

Remove the handler that cancels Tab. A form does not need to manage sequential navigation at all — the browser already does it correctly, and any focus containment belongs only to a modal dialog, which this is not:

    // delete the keydown handler that calls preventDefault() on Tab
    // inside div.mx-dataview-content

If focus must be moved on load, move it to the form's heading with `tabindex="-1"` rather than into a container that then holds it ([F10](https://www.w3.org/WAI/WCAG22/Techniques/failures/F10), [G21](https://www.w3.org/WAI/WCAG22/Techniques/general/G21)).
