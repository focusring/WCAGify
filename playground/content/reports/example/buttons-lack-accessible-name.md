---
title: Buttons lack an accessible name
sc: 4.1.2
severity: High
type: Technical
difficulty: Low
sample: page-3
---

The search and submit buttons on the product overview contain only an emoji. Screen readers announce them as "magnifying glass, button" and "envelope, button" or as an unnamed button, so users cannot tell what the buttons do.

The buttons are marked up like this:

```html
<button class="btn" onclick="search()">🔎</button>
<button class="btn" onclick="submitForm()">📨</button>
```

#### Recommendation

Give every control an accessible name that describes its purpose. Hide the emoji from assistive technology and add the name with `aria-label`:

```html
<button class="btn" onclick="search()" aria-label="Search">
  <span aria-hidden="true">🔎</span>
</button>
<button class="btn" onclick="submitForm()" aria-label="Submit form">
  <span aria-hidden="true">📨</span>
</button>
```

Visible text next to the icon is better still, because it helps everyone and is picked up by speech control software.
