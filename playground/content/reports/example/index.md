---
title: WCAG audit Example Website
baseline:
  - Windows 11 with Chrome and NVDA
  - macOS with Safari and VoiceOver
  - Android with Chrome and TalkBack
description: Accessibility audit for Example Website according to WCAG 2.2 level AA.
evaluation:
  evaluator: WCAGify
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
scope:
  - https://example.com
  - https://example.com/contact
  - https://example.com/products
technologies:
  - HTML
  - CSS
  - JavaScript
  - WAI-ARIA
scStatuses:
  passed:
    - '1.1.1'
    - '1.3.1'
    - '1.3.2'
    - '1.3.3'
    - '1.3.4'
    - '1.3.5'
    - '1.4.1'
    - '1.4.3'
    - '1.4.4'
    - '1.4.5'
    - '1.4.10'
    - '1.4.11'
    - '1.4.12'
    - '1.4.13'
    - '2.1.2'
    - '2.1.4'
    - '2.4.1'
    - '2.4.2'
    - '2.4.3'
    - '2.4.4'
    - '2.4.5'
    - '2.4.6'
    - '2.4.11'
    - '2.5.2'
    - '2.5.3'
    - '2.5.8'
    - '3.1.1'
    - '3.1.2'
    - '3.2.1'
    - '3.2.2'
    - '3.2.3'
    - '3.2.4'
    - '3.2.6'
    - '3.3.1'
    - '3.3.2'
    - '3.3.3'
    - '4.1.2'
    - '4.1.3'
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

This is an example report for a WCAG accessibility audit of Example Website.
