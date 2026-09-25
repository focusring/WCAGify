---
title: 'Two "Zo werkt het" links on the service page lead to different pages'
sc: 2.4.4
severity: Low
type: Content
difficulty: Low
sample: page-4
---

![Three help cards, "Chatbot Anna", "Veilig bellen via onze app" and "Bel de klantenservice". The button-styled link "Zo werkt het" under "Veilig bellen via onze app" is outlined in red; the chatbot card's paragraph ends in a text link "Zo werkt het.".](/api/uploads/test-audit/two-zo-werkt-het-links-on-the-service-page-lead-to-different-pages-2-4-4-1dcd4490.webp)

In the "<span lang="nl">Hulp nodig?</span>" section of the service page, the card **"<span lang="nl">Veilig bellen via onze app</span>"** ends in a button-styled link named **"<span lang="nl">Zo werkt het</span>"**. The card beside it, "<span lang="nl">Chatbot Anna</span>", has a link "<span lang="nl">Zo werkt het.</span>" in its paragraph. The two go to different pages (`/service-en-contact/bellen-via-de-app.html` and `/service-en-contact/chat-chatbot/index.html`) and are on screen together.

The chatbot link is clear from its sentence. The calling link is not: it sits alone in a `div`, and the card heading above it is not part of its context in the code. A screen-reader user who lists the links, or tabs through them, hears two almost identical "<span lang="nl">Zo werkt het</span>" links and cannot tell which one is about calling through the app.

#### Recommendation

Put the subject in the link text:

    <a href="/service-en-contact/bellen-via-de-app.html">Zo werkt bellen via de app</a>

([G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91), [H30](https://www.w3.org/WAI/WCAG22/Techniques/html/H30)).
