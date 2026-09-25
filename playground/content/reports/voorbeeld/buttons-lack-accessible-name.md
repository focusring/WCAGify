---
title: Knoppen hebben geen toegankelijke naam
sc: 4.1.2
severity: High
type: Technical
difficulty: Low
sample: page-3
---

De zoek- en verzendknop op het productoverzicht bevatten alleen een emoji. Schermlezers kondigen ze aan als "vergrootglas, knop" en "envelop, knop" of als een naamloze knop, zodat gebruikers niet weten wat de knoppen doen.

De knoppen zijn zo opgemaakt:

```html
<button class="btn" onclick="search()">🔎</button>
<button class="btn" onclick="submitForm()">📨</button>
```

#### Aanbeveling

Geef elke bediening een toegankelijke naam die het doel beschrijft. Verberg de emoji voor hulptechnologie en voeg de naam toe met `aria-label`:

```html
<button class="btn" onclick="search()" aria-label="Zoeken">
  <span aria-hidden="true">🔎</span>
</button>
<button class="btn" onclick="submitForm()" aria-label="Formulier verzenden">
  <span aria-hidden="true">📨</span>
</button>
```

Zichtbare tekst naast het icoon is nog beter, omdat die iedereen helpt en ook door spraakbesturing wordt herkend.
