---
title: WCAG-audit Voorbeeld Website
description: Toegankelijkheidsonderzoek van de Voorbeeld Website volgens WCAG 2.1 niveau AA.
language: nl
evaluation:
  evaluator: WCAGify
  commissioner: Voorbeeld Organisatie
  target: Voorbeeld Website
  targetLevel: AA
  targetWcagVersion: '2.1'
  date: '2025-01-15'
  specialRequirements: Geen bijzondere eisen
scope:
  - https://voorbeeld.nl
  - https://voorbeeld.nl/contact
  - https://voorbeeld.nl/producten
outOfScope:
  - https://voorbeeld.nl/admin
baseline:
  - Windows 11 met Chrome 120 en NVDA 2024.1
  - macOS 14 met Safari 17 en VoiceOver
  - Android 14 met Chrome en TalkBack
technologies:
  - HTML
  - CSS
  - JavaScript
  - WAI-ARIA
sample:
  - title: Homepage
    id: pagina-1
    url: https://voorbeeld.nl
    description: De hoofdpagina van de website
  - title: Contactpagina
    id: pagina-2
    url: https://voorbeeld.nl/contact
    description: Pagina met contactformulier
  - title: Productoverzicht
    id: pagina-3
    url: https://voorbeeld.nl/producten
    description: Overzicht van alle producten
---

Dit is een voorbeeldrapport voor een WCAG-toegankelijkheidsaudit van de Voorbeeld Website.
