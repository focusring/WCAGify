---
title: Image lacks descriptive alt text
sc: 1.1.1
severity: Medium
type: Content
difficulty: Low
sample: page-4
---

The image within the article has an empty `alt` attribute. An empty `alt` marks an image as decorative, so screen readers skip it. Here the image carries meaning, which leaves users who rely on a screen reader without the information sighted readers get from it.

The image is marked up like this:

```html
<img src="awesome_cat.jpg" alt="" />
```

#### Recommendation

Provide a descriptive `alt` text. The text should convey the content and function of the image in the context of the article:

```html
<img src="awesome_cat.jpg" alt="A cute cat lounging comfortably" />
```

Reserve an empty `alt` for images that are purely decorative and add nothing to the content.
