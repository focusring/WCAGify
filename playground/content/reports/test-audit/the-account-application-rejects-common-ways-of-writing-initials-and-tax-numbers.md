---
title: The account application rejects common ways of writing initials and tax numbers
sc: 3.3.2
severity: Medium
type: Content
sample: page-30
---

![The field "Je voorletter(s)" on step 2 of the account application, holding "T. .T." after the field rewrote "T. T.", with a red border and the error "De ingevulde intitialen zijn ongeldig. Gebruik alleen hoofdletters en punten." under it.](/api/uploads/test-audit/the-account-application-rejects-common-ways-of-writing-initials-and-tax-numbers-3-3-2-530dd9ba.webp)

Two fields on step 2 of the application refuse values written in a common way, and say what they accept only after refusing:

- **Je voorletter(s)**: "T. T.", with a space as Dutch initials are often written, is rewritten by the field to "T. .T." and refused with "<span lang="nl">De ingevulde intitialen zijn ongeldig. Gebruik alleen hoofdletters en punten.</span>" "T T" is refused as well. The label says only "<span lang="nl">Je voorletter(s)</span>" and there is no hint.
- **Wat is je fiscaal identificatienummer in België?** (after answering that you also pay tax in Belgium): the number as it is printed on a Belgian identity card, "85.07.30-033.28", is refused with "<span lang="nl">Ongeldig nummer</span>". Nothing says to type digits only, or how many.

Users find out the rule by making the mistake. For people who find forms hard, each refusal is a point where they may give up.

#### Recommendation

State the expected form under the label and tie it to the field with `aria-describedby`, for example "<span lang="nl">Bijvoorbeeld: J.P.</span>" and "<span lang="nl">Alleen cijfers, zonder punten of streepjes</span>" ([G89](https://www.w3.org/WAI/WCAG22/Techniques/general/G89)). Better still, accept the variants by removing spaces, dots and dashes before validating.
