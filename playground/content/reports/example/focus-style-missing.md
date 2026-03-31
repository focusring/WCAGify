---
title: Focus style missing on interactive elements
sc: 2.4.7
severity: Medium
type:
sample: page-1
---

The homepage is missing a visible focus style on multiple interactive elements, including navigation links and buttons. This makes it unclear for keyboard users which element has focus.

#### Recommendation

Add a clearly visible focus style to all interactive elements. Use CSS `:focus-visible` to show a focus indicator that meets the minimum contrast ratio of 3:1 against the background.
