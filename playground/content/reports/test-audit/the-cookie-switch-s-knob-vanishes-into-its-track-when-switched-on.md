---
title: "The cookie switch's knob vanishes into its track when switched on"
sc: 1.4.11
severity: Medium
type: Design
sample: page-10
---

![A cookie category switch in the on position, where the round knob is barely distinguishable from the dark teal track behind it.](/api/uploads/test-audit/the-cookie-switch-s-knob-vanishes-into-its-track-when-switched-on-1-4-11-4ec2a9a1.webp)

Each cookie category in the preference centre is controlled by a switch. In the **on** state the knob is `#00716b` on a `#004c4c` track — a contrast ratio of **1.67:1**, where 3:1 is required for the part of a control that shows its state.

The knob is what tells a user which way the switch is set. At 1.67:1 it merges into the track, so the on position has to be inferred from the track colour alone.

That inference is also weak: the **on track (`#004c4c`) against the off track (`#767676`) differs by only 2.16:1**, so someone comparing two switches down the panel has very little to go on.

The off state is fine — the knob is clearly visible there, and the off track measures 4.54:1 against the panel. The problem is specifically the state a user most needs to confirm: the one where they have allowed something.

#### Recommendation

Keep the knob light in both states so it always reads against its track:

    .ot-switch .ot-switch-nob::before { background-color: #ffffff; }

White on `#004c4c` gives 9.8:1 and on `#767676` gives 4.5:1, so one value works for both. Raising the difference between the two track colours to at least 3:1 would also help anyone scanning the list ([G195](https://www.w3.org/WAI/WCAG22/Techniques/general/G195)).
