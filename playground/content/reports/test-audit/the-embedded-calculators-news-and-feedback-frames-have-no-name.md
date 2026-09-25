---
title: 'The embedded calculators, news and feedback frames have no name'
sc: 4.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-14
---

![The mortgage calculator "Hoeveel kan ik lenen voor een woning?" with its income and energy-label fields and the maximum mortgage result, all shown inside an embedded frame outlined in red.](/api/uploads/test-audit/the-embedded-calculators-news-and-feedback-frames-have-no-name-4-1-2-b471d297.webp)

The mortgage calculator on this page is an embedded frame, `iframe#tcm-215993-iframe`, with no `title`, `aria-label` or `aria-labelledby`. It has `tabindex="0"`, so it is a Tab stop, and the accessibility tree shows it only as a nameless frame. A screen-reader user who lands on it, or opens the list of frames, hears no word about what it holds, although the whole calculator sits inside it.

The component that embeds sub-applications on the site never sets a title, and the other untitled frames are the same case:

- page-17, the share prices: the financial-news frame `iframe#iFrameResizer0` that the beursinfo market-data application nests inside its own frame (the beursinfo frame itself is named);
- page-20, the personal-loan calculator `iframe#tcm-267699-iframe` (also a Tab stop);
- page-31, the extended mortgage wizard `iframe#tcm-212927-iframe` (also a Tab stop);
- page-2, page-4, page-6, page-10 to page-13, page-15, page-18, page-19 and page-22 to page-26: the inline Qualtrics thumbs widget "<span lang="nl">Wat vind je van deze informatie?</span>" (for example `iframe[name="survey-iframe-SI_bqNvG0YpbqpqHAy"]` on page-22), which is supplied by Qualtrics and shown on phone-sized screens. The Qualtrics Feedback survey frame is titled "Survey window" and is fine.

#### Recommendation

Give every frame a `title` that says what it contains, set by the embed component from the content it places, and ask Qualtrics for a title on the inline widget's frame:

    <iframe id="tcm-215993-iframe" title="Hoeveel kan ik lenen voor een woning?" src="…"></iframe>

([H64](https://www.w3.org/WAI/WCAG22/Techniques/html/H64))
