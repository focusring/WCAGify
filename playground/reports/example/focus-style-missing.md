---
title: Focusstijl ontbreekt op interactieve elementen
description: Op de homepage ontbreekt een zichtbare focusstijl op meerdere interactieve elementen, waaronder de navigatielinks en knoppen. Dit maakt het voor toetsenbordgebruikers onduidelijk welk element de focus heeft.
difficulty: Low
sample: pagina-1
sc: 2.4.7
severity: Medium
---

Op de homepage ontbreekt een zichtbare focusstijl op meerdere interactieve elementen, waaronder de navigatielinks en knoppen. Dit maakt het voor toetsenbordgebruikers onduidelijk welk element de focus heeft.

## Aanbeveling

Voeg een duidelijk zichtbare focusstijl toe aan alle interactieve elementen. Gebruik CSS `:focus-visible` om een focusindicator te tonen die voldoet aan het minimale contrast van 3:1 ten opzichte van de achtergrond.
