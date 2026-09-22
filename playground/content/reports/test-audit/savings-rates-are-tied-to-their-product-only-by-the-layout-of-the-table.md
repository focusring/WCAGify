---
title: Savings rates are tied to their product only by the layout of the table
sc: 1.3.1
severity: High
type: Technical
sample: page-16
---

![The Spaarrekeningen rate table, where several rows show an interest rate and a balance bracket but leave the product column blank, relying on the row above to say which account it belongs to.](/api/uploads/test-audit/savings-rates-are-tied-to-their-product-only-by-the-layout-of-the-table-1-3-1-28cf83a9.webp)

The **Spaarrekeningen** table lists interest rates per product and per balance bracket. Where one product has several brackets, only the first row names it: **10 of the 17 data rows leave the product cell empty** and rely on the reader's eye travelling up the column to the last filled cell.

Nothing carries that relationship in the markup. The empty cells are plain `<td>` with no `rowspan`, the product column is not `<th>`, and there is no `scope`, no `headers`/`id` pairing and no `<caption>` on any of the four tables on this page.

A screen-reader user moving through the table hears "3,25%, from €50,000" with no product name at all. On a page whose entire purpose is comparing rates between accounts, the figure becomes meaningless — and this table is the largest on the page, with 18 rows.

The other three tables on this page do not have the problem: their first column is always filled, so each row identifies itself.

Automated testing does not catch this. axe-core reports zero violations on this page in every state, because the header cells it can see are correctly marked; what is missing is the row axis.

#### Recommendation

Let the product cell span the rows it covers, and mark it as the row header:

    <tr>
      <th scope="rowgroup" rowspan="3">ABN AMRO Spaarrekening</th>
      <td>€0 – €25.000</td><td>1,50%</td>
    </tr>
    <tr><td>€25.000 – €50.000</td><td>2,00%</td></tr>

Add `scope="col"` to the header row and a `<caption>` naming each table, so the four tables can be told apart ([H63](https://www.w3.org/WAI/WCAG22/Techniques/html/H63), [H51](https://www.w3.org/WAI/WCAG22/Techniques/html/H51), [H39](https://www.w3.org/WAI/WCAG22/Techniques/html/H39)).
