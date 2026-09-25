---
title: The two example-calculation tables are told apart only by a paragraph above them
sc: 1.3.1
severity: Medium
type: Content
difficulty: Low
sample: page-20
---

![Two tables with the same four column headers (Kredietbedrag, Vaste debetrente/Jaarlijks kostenpercentage, Maandbedrag, Totaal door jou te betalen) and the same loan amounts. Above each, in plain text, "Looptijd 60 maanden (5 jaar)" and "Looptijd 120 maanden (10 jaar)".](/api/uploads/test-audit/the-two-example-calculation-tables-are-told-apart-only-by-a-paragraph-above-them-1-3-1-3b67a3b0.webp)

The "<span lang="nl">Voorbeeldberekening Persoonlijke Lening</span>" on the personal-loan page shows two tables with identical headers and identical first columns (€ 5.000 to € 50.000). The one thing that tells them apart, and that gives every monthly amount its meaning, is the loan term. It is written above each table as a plain paragraph, `<p>Looptijd 60 maanden (5 jaar)</p>` and `<p>Looptijd 120 maanden (10 jaar)</p>`.

Visually these paragraphs are the tables' titles, but neither table has a `<caption>`, `aria-label` or `aria-labelledby`, and the paragraphs are not headings. A screen-reader user who jumps from table to table, or reads a cell with table navigation, hears "<span lang="nl">€ 208,56, Maandbedrag</span>" and "<span lang="nl">€ 127,77, Maandbedrag</span>" with nothing inside the table to say that one is for 5 years and the other for 10.

#### Recommendation

Move each lead-in into its table as the caption, and mark the column headers:

    <table>
      <caption>Looptijd 60 maanden (5 jaar)</caption>
      <tr><th scope="col">Kredietbedrag</th><th scope="col">Vaste debetrente/ Jaarlijks kostenpercentage</th>…</tr>
      …
    </table>

The caption can be styled exactly like the current paragraph ([H39](https://www.w3.org/WAI/WCAG22/Techniques/html/H39), [H63](https://www.w3.org/WAI/WCAG22/Techniques/html/H63)).
