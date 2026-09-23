---
title: "At phone width the rate table's hidden columns cannot be scrolled by keyboard"
sc: 2.1.1
severity: Medium
type: Technical
sample: page-15
---

![The mortgage-rate tool at 320 pixels wide. The rate table shows the period column and the "NHG" and "≤ 65%" columns. The "≤ 85%" column fades out at the right edge of the scroll area, outlined in red, and the columns after it are out of view.](/api/uploads/test-audit/at-phone-width-the-rate-table-s-hidden-columns-cannot-be-scrolled-by-keyboard-2-1-1-43e8b890.webp)

At a 320 px wide viewport the rate table in the mortgage-rate tool no longer fits and scrolls sideways inside `div.align-header.scrollable-table`: 366 px of table in an area of 179 px. The columns **"≤ 85%", "≤ 90%" and "> 90%"** are out of view. The scroll area has no `tabindex` and contains nothing focusable, so it cannot be scrolled from the keyboard. axe reports it as `scrollable-region-focusable`.

Keyboard users at this width, including users who zoom in on a desktop browser, cannot read the rates for three of the six loan-to-value bands. Recent Chromium versions make such areas focusable on their own, but not every browser does, and the page cannot rely on it.

#### Recommendation

Make the scroll area focusable and give it a name, so it can be reached with Tab and scrolled with the arrow keys:

    <div class="align-header scrollable-table" tabindex="0" role="region"
         aria-label="Rentetabel">
      <table id="primaryTable">…</table>
    </div>

Alternatively, reflow the table at narrow widths so nothing needs to scroll ([G202](https://www.w3.org/WAI/WCAG22/Techniques/general/G202)).
