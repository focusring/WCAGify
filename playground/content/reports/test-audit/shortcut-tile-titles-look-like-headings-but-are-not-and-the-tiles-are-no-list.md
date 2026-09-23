---
title: 'Shortcut tile titles look like headings but are not, and the tiles are no list'
sc: 1.3.1
severity: Medium
type: Technical
sample: page-7
---

![The accessibility page under its hero, with a row of three white tiles outlined in red, titled "Ik ben blind of slechtziend", "Ik ben doof of slechthorend" and "Ik wil leren bankieren" in large type. Below them the heading "Samen lossen we het op" and three cards with headings of the same size.](/api/uploads/test-audit/shortcut-tile-titles-look-like-headings-but-are-not-and-the-tiles-are-no-list-1-3-1-66cc1b28.webp)

The shortcut tiles (`a.segment-tile`) present each route as a titled card, but the markup carries neither the titles nor the grouping.

- **The titles are not headings.** On the accessibility page (page-7) the three tiles "Ik ben blind of slechtziend", "Ik ben doof of slechthorend" and "Ik wil leren bankieren" open with a title set at 26 px (`p.emc-h4`), the same size as the real headings of the cards just below them. They are `<p>` elements, so the heading list jumps from "Bankieren voor iedereen" straight to "Samen lossen we het op". A screen-reader user who navigates by headings never meets the page's three main routes.
- **The tiles are not a list.** Each tile is a bare link in its own `div`, with no `ul`/`li`, so the set and its size are not exposed. The comparable link blocks on the site ("Je situatie", "Direct regelen", every footer column) are lists.

The same component is used on the homepage (page-1, eight tiles), the English homepage (page-2), the payments page (page-11, two grids of six), the account-opening page (page-12), the app page (page-18) and the online-banking page (page-24). The titles are `p.emc-h4` on each sample where they were checked.

#### Recommendation

Render the tiles as a list and the tile title as a heading inside the link, keeping the class for the look:

    <ul class="segment-tiles-wrapper row">
      <li class="col-lg-4">
        <a class="segment-tile" href="…">
          <h3 class="emc-h4">Ik ben blind of slechtziend</h3>
          <p>Hulpmiddelen om te bankieren als je blind bent of slecht ziet</p>
        </a>
      </li>
      …
    </ul>

Choose the heading level from the heading that precedes the tiles on each page ([H42](https://www.w3.org/WAI/WCAG22/Techniques/html/H42), [H48](https://www.w3.org/WAI/WCAG22/Techniques/html/H48), [F2](https://www.w3.org/WAI/WCAG22/Techniques/failures/F2)).
