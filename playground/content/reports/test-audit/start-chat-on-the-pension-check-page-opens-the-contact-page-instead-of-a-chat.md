---
title: '"Start chat" on the pension check page opens the contact page instead of a chat'
sc: 2.4.4
severity: Low
type: Technical
difficulty: Low
sample: page-21
---

![The help block at the bottom of the pension check page. The "Chatbot Anna" card says "Chat met chatbot Anna" and has a button "Start chat".](/api/uploads/test-audit/start-chat-on-the-pension-check-page-opens-the-contact-page-instead-of-a-chat-2-4-4-2c84104f.webp)

At the bottom of the pension check page (page-21), the **"Chatbot Anna"** card says "Chat met chatbot Anna" and has a link named **"Start chat"** (`#tcm-243346-0`). This link does not start a chat. It has no `initiate-chat` class and its `href` is `/nl/prive/service-en-contact/index.html`, the general Service en Contact page. The same card on the service page, the brochure page, the complaints page and the chat page (page-4, page-7, page-8, page-25) does open the chatbot (`initiate-chat`, `chat-chatbot.html`).

A visitor who follows "Start chat" expects a chat window and lands on a different page, where the chat has to be found again. This was checked from the link's attributes. The link was not followed, because that would start a real chat session.

#### Recommendation

Give this card the same chat link as the other pages. If the chat is meant to be unavailable here, name the link after where it goes, for example "Naar Service en Contact" ([G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91)).
