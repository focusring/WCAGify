---
title: Call to action does not work with the keyboard
sc: 2.1.1
severity: High
type: Technical
difficulty: Low
sample: page-1
---

The call to action in the header only reacts to a mouse click. It is a `div` with a click handler, so it is not in the tab order and does not respond to Enter or Space. Keyboard users and screen reader users cannot reach it at all.

The call to action is marked up like this:

```html
<div class="link" onClick="navigateCallToAction()">Get a Quote!</div>
```

#### Recommendation

Use an `a` element for navigation and put the destination in the `href` attribute:

```html
<a class="link" href="/request-a-quote">Get a Quote!</a>
```

A link is focusable and keyboard operable out of the box, works without JavaScript and tells assistive technology and search engines what it does.
