---
title: The chat window cuts off its messages on narrow screens
sc: 1.4.10
severity: High
type: Technical
difficulty: Low
sample: page-25
---

![The chat window at 320 pixels wide, filling the screen. The chatbot's messages are cut off at the right edge mid-word, and the quick-reply button Ik kan niet inloggen is cut off too.](/api/uploads/test-audit/the-chat-window-cuts-off-its-messages-on-narrow-screens-1-4-10-3ffa0166.webp)

Below about 390 pixels wide, which includes a 1280 pixel window zoomed to 400 %, the chat window fills the screen, but the column inside it keeps a **minimum width of 400 pixels** (`max-sm:emc-min-w-[400px]`). At 320 pixels the message list `ul#chat-messages` is 400 pixels wide in a 320 pixel panel: the message text runs to x = 356 and the quick-reply button "<span lang="nl">Ik kan niet inloggen</span>" to x = 324.

Nothing scrolls sideways, neither the panel nor the page, so the ends of lines ("Ik", "van", "we") are cut off and **cannot be reached at all**. Phone users and people who zoom in lose part of every chatbot message and of the answer buttons. At 390 pixels nothing is cut.

The window is the embedded chat component (`<chat-client>`), the same on every page that offers the chat. Also on page-4, reproduced at 320 and 375 pixels, where the "<span lang="nl">chat werkt op dit moment niet</span>" notice is cut too; the same component is embedded on page-8 and page-19.

#### Recommendation

Drop the minimum width below the `sm` breakpoint so the column fits the panel:

    /* replace max-sm:emc-min-w-[400px] */
    @media (max-width: 639px) { .chat-column { min-width: 0; width: 100%; } }

Long words then wrap inside the bubbles instead of running off the edge ([C31](https://www.w3.org/WAI/WCAG22/Techniques/css/C31), [C38](https://www.w3.org/WAI/WCAG22/Techniques/css/C38)).
