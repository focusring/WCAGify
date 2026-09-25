---
title: The fixed-rate periods in the mortgage-rate table are not row headers
sc: 1.3.1
severity: Medium
type: Technical
sample: page-15
---

![The mortgage-rate table with the column headers "Rentevaste periode", "NHG", "≤ 65%", "≤ 85%", "≤ 90%" and "> 90%". Down the left, set off by a vertical rule, run the periods "Variabel", "1 jaar", "2 jaar" and so on, each followed by five rates.](/api/uploads/test-audit/the-fixed-rate-periods-in-the-mortgage-rate-table-are-not-row-headers-1-3-1-b38af95a.webp)

The rate table in the mortgage-rate tool (`table#primaryTable`) is a grid. Each rate belongs to a fixed-rate period, given by the row ("Variabel", "<span lang="nl">5 jaar</span>", "<span lang="nl">10 jaar</span>" …), and to a loan-to-value band, given by the column ("NHG", "≤ 65%" … "> 90%"). The column headers are correct `<th>` cells in a `<thead>`. The period cells are plain `<td>`, with no `scope`, `headers` or `role="rowheader"`, although the vertical rule and the heading "<span lang="nl">Rentevaste periode</span>" present them as a header column.

A screen-reader user moving down the "≤ 65%" column hears "4,15%", "4,35%", "4,40%" with no period, and has to leave the column to find out which term each rate is for. The table has 6 rows, or 14 after "<span lang="nl">Toon alle periodes</span>".

This is a different table from the savings rates on page-16, which have their own issue.

#### Recommendation

Mark each period as the header of its row, and the top row as column headers:

    <thead><tr><th scope="col">Rentevaste periode</th><th scope="col">NHG</th>…</tr></thead>
    <tbody>
      <tr><th scope="row">5 jaar</th><td>4,29%</td><td>4,38%</td>…</tr>
    </tbody>

A `<caption>` naming the chosen mortgage can replace the loose sentence above the table ([H63](https://www.w3.org/WAI/WCAG22/Techniques/html/H63), [H51](https://www.w3.org/WAI/WCAG22/Techniques/html/H51), [H39](https://www.w3.org/WAI/WCAG22/Techniques/html/H39)).
