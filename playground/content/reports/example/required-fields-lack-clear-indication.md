---
title: Required fields are not indicated
sc: 3.3.2
severity: Medium
type: Design
difficulty: Medium
sample: page-2
---

The contact form has fields that must be filled in, but nothing tells users which ones. Only after submitting do they learn that the name and e-mail fields were required, which is confusing for everyone and especially for people with cognitive disabilities.

The fields are marked up like this:

```html
<div class="input-field">
  <label for="fullname">Fullname:</label>
  <input type="text" id="fullname" required />
</div>
<div class="input-field">
  <label for="email">Email:</label>
  <input type="email" id="email" required />
</div>
```

#### Recommendation

Say in the label which fields are required, so the instruction is visible before the field is used and is read out by screen readers together with the label:

```html
<div class="input-field">
  <label for="fullname">Fullname (required)</label>
  <input type="text" id="fullname" required />
</div>
<div class="input-field">
  <label for="email">Email (required)</label>
  <input type="email" id="email" required />
</div>
```

If an asterisk is used instead, explain its meaning once at the top of the form.
