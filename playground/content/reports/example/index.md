---
title: WCAG audit Example Website
baseline:
  - Windows 11 with Chrome and NVDA
  - macOS with Safari and VoiceOver
  - Android with Chrome and TalkBack
description: Accessibility audit for Example Website according to WCAG 2.2 level AA.
evaluation:
  evaluator: Focusring
  commissioner: Example Organisation
  target: Example Website
  targetLevel: AA
  targetWcagVersion: '2.2'
  date: 2025-01-15
  specialRequirements: None
language: en
outOfScope:
  - https://example.com/admin
sample:
  - title: Homepage
    id: page-1
    url: https://example.com
    description: The homepage of the website
  - title: Contact page
    id: page-2
    url: https://example.com/contact
    description: Page with contact form
  - title: Product overview
    id: page-3
    url: https://example.com/products
    description: Overview of all products
  - title: Blog post
    id: page-4
    url: https://example.com/blog/example-post
    description: An example of a blog post
scope:
  - https://example.com
  - https://example.com/contact
  - https://example.com/products
  - https://example.com/blog
technologies:
  - HTML
  - CSS
  - JavaScript
  - WAI-ARIA
scStatuses:
  # Criteria with no matching content anywhere in the sample. WCAG-EM counts
  # these as satisfied. Every other criterion passes unless an issue records a
  # failure against it.
  not-present:
    - '1.2.1'
    - '1.2.2'
    - '1.2.3'
    - '1.2.4'
    - '1.2.5'
    - '1.4.2'
    - '2.2.1'
    - '2.2.2'
    - '2.3.1'
    - '2.5.1'
    - '2.5.4'
    - '2.5.7'
    - '3.3.4'
    - '3.3.7'
    - '3.3.8'
---

This is an example report for a WCAG accessibility audit of Example Website. It shows how findings are reported: every issue names the page it was found on, the success criterion it fails, its severity and a recommendation with the corrected markup, so a development team can pick it up without further explanation.

The evaluated pages contain six issues across the four WCAG principles. None of them block a task completely, but together they keep keyboard and screen reader users from using the contact form and the product search with confidence.
