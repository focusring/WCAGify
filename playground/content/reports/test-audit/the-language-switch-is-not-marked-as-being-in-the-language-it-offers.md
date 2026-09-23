---
title: The language switch is not marked as being in the language it offers
sc: 3.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-16
---

![The top bar of the header with the link "English" beside the segment options, on an otherwise Dutch page.](/api/uploads/test-audit/the-language-switch-is-not-marked-as-being-in-the-language-it-offers-3-1-2-a180662d.webp)

The header of every Dutch page carries a link reading **"English"**, and the English pages carry the mirror-image link **"Nederlands"**. Neither is marked with a `lang` attribute — in fact **no element below `<body>` on this page carries a `lang` attribute at all**, so both words inherit the page language and are announced with the wrong pronunciation rules.

A Dutch speech synthesiser reading "English" as a Dutch word, or an English one reading "Nederlands", produces something a user may not recognise as the name of their own language. That matters more here than for an ordinary foreign word, because this link is how a user reaches the version of the site they can read.

This is the shared header template, so it applies to every page in the audit. It was confirmed on page-2 (the English build, "Nederlands") page-16 (the Dutch build, "English"), page-22, page-23 and page-24.

#### Recommendation

Mark the link with the language of its own text:

    <a href="/en/personal/interest/current-interest-rates.html" lang="en">English</a>
    <a href="/nl/prive/index.html" lang="nl">Nederlands</a>

See [H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58).
