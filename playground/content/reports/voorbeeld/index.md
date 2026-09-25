---
title: WCAG-audit Voorbeeldwebsite
baseline:
  - Windows 11 met Chrome en NVDA
  - macOS met Safari en VoiceOver
  - Android met Chrome en TalkBack
description: Toegankelijkheidsonderzoek van Voorbeeldwebsite volgens WCAG 2.2 niveau AA.
evaluation:
  evaluator: Focusring
  commissioner: Voorbeeldorganisatie
  target: Voorbeeldwebsite
  targetLevel: AA
  targetWcagVersion: '2.2'
  date: 2025-01-15
  specialRequirements: Geen
language: nl
outOfScope:
  - https://example.com/admin
sample:
  - title: Homepage
    id: page-1
    url: https://example.com
    description: De homepage van de website
  - title: Contactpagina
    id: page-2
    url: https://example.com/contact
    description: Pagina met contactformulier
  - title: Productoverzicht
    id: page-3
    url: https://example.com/products
    description: Overzicht van alle producten
  - title: Blogartikel
    id: page-4
    url: https://example.com/blog/example-post
    description: Een voorbeeld van een blogartikel
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
  # Criteria waarvoor nergens in de steekproef content voorkomt. WCAG-EM telt
  # deze als voldaan. Elk ander criterium is goedgekeurd, tenzij een bevinding
  # het afkeurt.
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

Dit is een voorbeeldrapport van een WCAG-toegankelijkheidsonderzoek van Voorbeeldwebsite. Het laat zien hoe bevindingen worden gerapporteerd: elke bevinding noemt de pagina waarop ze is gevonden, het succescriterium dat niet wordt gehaald, de ernst en een aanbeveling met de gecorrigeerde markup, zodat een ontwikkelteam er zonder verdere uitleg mee aan de slag kan.

De onderzochte pagina's bevatten zes bevindingen, verdeeld over de vier WCAG-principes. Geen ervan blokkeert een taak volledig, maar samen zorgen ze ervoor dat toetsenbord- en schermlezergebruikers het contactformulier en het zoeken naar producten niet met vertrouwen kunnen gebruiken.
