---
title: The struck-through list of what is not insured is too light to read
sc: 1.4.3
severity: Medium
type: Design
sample: page-19
---

![Two cards under "Wat is wel en niet verzekerd?". The left card lists covered items in dark text with ticks; the right card, "Niet verzekerd voor onder andere:", lists five items in light grey, struck-through text with crosses.](/api/uploads/test-audit/the-struck-through-list-of-what-is-not-insured-is-too-light-to-read-1-4-3-68a20efe.webp)

On the travel insurance page, the items under **"Niet verzekerd voor onder andere:"** ("Schade door opzet", "Schade onder invloed van alcohol, drugs of geneesmiddelen", "Schade door een gevaarlijke sport", "Schade tijdens zakelijke reizen", "Medische kosten die niet noodzakelijk zijn") are drawn in `#7d7d7d` on white. That is **4.11:1** at 16 px normal weight, against the required 4.5:1. The item "Contant geld" in the "Standaard dekking" card uses the same style.

The text is also struck through, and the line runs through letters that are already faint. These lines are the policy's exclusions, what the customer is not insured for, so they are content a reader deciding what to buy has to be able to read. They are list items, not inactive controls, so no exception applies. axe reports them as `color-contrast` violations at every width.

That the exclusion is not conveyed to assistive technology at all is a separate issue, "Screen readers are told cash is covered by the standard travel policy".

#### Recommendation

Darken the exclusion text to at least `#767676` on white (4.54:1), or better `#595959` (7:1), and let the ✕ marker and a word such as "niet" carry the "excluded" meaning instead of a faded, struck-through colour ([G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)).
