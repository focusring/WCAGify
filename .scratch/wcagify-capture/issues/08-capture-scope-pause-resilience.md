# 08: Capture scope, pause and resilience

**What to build:** A capture has a scope: the origins of the tab it started on, extended by origins the target loads resources from. Only in-scope tabs are attached; tabs the commissioner opens elsewhere are never adopted; navigating out of scope detaches. Tabs under capture are marked non-discardable. The commissioner can pause and resume. Capture state lives in extension storage, so closing and reopening the side panel shows the running capture. The panel explains the debugger bar before starting and reports in plain words when attachment is refused by policy or by another debugger.

**Blocked by:** 06 WACZ export and first end-to-end test, 07 Milestone 0: replay proof on the customer SPA

**Status:** ready-for-agent

- [ ] Opening another site in a new tab during a capture records nothing from it (end-to-end test)
- [ ] A link from the target that opens a new in-scope tab is attached automatically
- [ ] Closing and reopening the side panel shows the running capture with its counts
- [ ] Pause stops recording and resume continues; the pause is visible in the panel
- [ ] Attachment refused by policy or by another debugger shows a plain-words message in Dutch and English
- [ ] The panel explains the debugger bar and what dismissing it does before the first start
