---
title: Hidden focus-trap elements in the mobile popovers can take keyboard focus
sc: 4.1.2
severity: Low
type: Technical
difficulty: Low
sample: page-7
---

![The phone-width header with the "NL" language popover open below it, offering "English" and "Nederlands", with focus on "Nederlands".](/api/uploads/test-audit/hidden-focus-trap-elements-in-the-mobile-popovers-can-take-keyboard-focus-4-1-2-df52dfb6.webp)

The language popover that opens from **"Taal - NL"** in the phone-width header keeps focus inside itself with two invisible guard elements, one before and one after its links. They are `span.p-hidden-accessible.p-hidden-focusable` elements that PrimeVue adds, and each carries both `tabindex="0"` and `aria-hidden="true"`.

That combination is contradictory: the elements are in the keyboard's tab order, but hidden from assistive technology. If focus lands on one, a screen reader has nothing to announce. axe reports it as an `aria-hidden-focus` violation on page-4. In the keyboard walks the popover's own script moved focus on straight away, so Tab kept cycling between "English" and "Nederlands", which is why this is a minor defect.

The same pair of guards sits in the "Kies Segment" popover, the mobile navigation drawer and the search overlay, where axe asks for them to be reviewed (page-4, page-7, page-12, page-16, page-24, page-26). It is the same component everywhere.

#### Recommendation

Do not make a hidden element focusable. Either take the guards out of the tab order and keep focus in the popover some other way, for example by making the rest of the page `inert` while it is open, or drop `aria-hidden` from them:

    <span class="p-hidden-accessible p-hidden-focusable" tabindex="-1" aria-hidden="true"></span>
    <!-- and while the popover is open: -->
    <main inert>…</main>

See the ACT rule [Element with aria-hidden has no content in sequential focus navigation](https://www.w3.org/WAI/standards-guidelines/act/rules/6cfa84/) and the APG note on [hiding semantics](https://www.w3.org/WAI/ARIA/apg/practices/hiding-semantics/).
