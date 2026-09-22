---
title: The chat window is not identified as a dialog
sc: 4.1.2
severity: High
type: Technical
sample: page-25
---

![The chat window open on a phone-width screen, filling the display completely with the page behind it hidden from view.](/api/uploads/test-audit/the-chat-window-is-not-identified-as-a-dialog-4-1-2-6120fdba.webp)

Opening the chat shows a window that behaves in every way like a modal dialog: it holds keyboard focus in a five-element cycle, Escape closes it, and at phone widths it **fills the entire screen**, covering the header and the page.

It is not exposed as one. `div[data-component-type="chat-window"]` carries **no `role="dialog"`, no `aria-modal`, and no accessible name**. The page behind it is not marked `aria-hidden` either, so a screen-reader user browsing by element can still wander through content that is completely hidden from view.

The launcher button has the matching gap: `button[aria-label="Chat button"]` **never carries `aria-expanded`**, so nothing says whether the chat is open or closed.

The keyboard behaviour is correct and deserves saying so: focus is trapped deliberately, never escapes behind the window, and both Escape and the "Minimaliseer chat" control close it and return focus to the launcher. What is missing is only the markup that tells assistive technology what this thing is.

A second, separate fault in the same component: the chat menu button carries `aria-controls="icon_menu"`, and **no element with that id exists** in the shadow root or the document — the menu is `ul#icon_menu_list`. It also has `aria-haspopup="true"` with **no `aria-expanded`** in either state.

#### Recommendation

Give the window the semantics its behaviour already implies:

    <div role="dialog" aria-modal="true" aria-labelledby="chat-heading">
      <h2 id="chat-heading">Chat met ABN AMRO</h2>
      …
    </div>

Add `aria-expanded` to the launcher and to the menu button, and point `aria-controls` at `icon_menu_list`. With `aria-modal="true"` set, assistive technology will treat the rest of the page as inert without further work ([ARIA Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
