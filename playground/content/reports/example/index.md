---
title: WCAG audit Example Website
baseline:
  - Windows 11 with Chrome and NVDA
  - macOS with Safari and VoiceOver
  - Android with Chrome and TalkBack
description: Accessibility audit for Example Website according to WCAG 2.1 level AA.
evaluation:
  evaluator: WCAGify
  commissioner: Example Organisation
  target: Example Website
  targetLevel: AA
  targetWcagVersion: '2.1'
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
scope:
  - https://example.com
  - https://example.com/contact
  - https://example.com/products
technologies:
  - HTML
  - CSS
  - JavaScript
  - WAI-ARIA
---

This is an example report for a WCAG accessibility audit of Example Website.
