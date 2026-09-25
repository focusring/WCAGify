---
title: The account and card number boxes of the e.dentifier login are barely outlined
sc: 1.4.11
severity: Medium
type: Design
difficulty: Low
sample: page-3
---

![The e.dentifier login fields under "Rekening- en pasnummer". The account box is outlined in orange because it is in error; the small card number box beside it has only a very light grey outline. Below, the "Respons" field has a clearly visible dark grey border.](/api/uploads/test-audit/the-account-and-card-number-boxes-of-the-e-dentifier-login-are-barely-outlined-1-4-11-9aa48db3.webp)

In the e.dentifier login the two boxes under **"<span lang="nl">Rekening- en pasnummer</span>"** (`input#account-number` and `input#card-number`) are outlined with a 1 px border in `#cccccc` on the white card: **1.61:1**, where 3:1 is needed. The grey prefix "NL ** ABNA 0" inside the account box (`#f2f7f7`, 1.07:1) does not mark the field either.

The card number box is empty, 52 by 42 pixels, and has nothing else that shows where it is. Users with low vision can easily miss that there is a second box to fill in. The "Respons" field just below and the e-mail field of the security-key login use `#666666` (5.74:1), so the same page already has a border that works. Only a field in error gets an orange border (3.56:1).

#### Recommendation

Use the border colour of the other login fields:

    .abnibancard input { border: 1px solid #666666; }

Any colour of at least 3:1 against white will do ([G207](https://www.w3.org/WAI/WCAG22/Techniques/general/G207)).
