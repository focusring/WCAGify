# 09: Storage snapshots

**What to build:** At every recorded page load the extension snapshots localStorage and sessionStorage for the page's origin. The export carries the snapshots per origin with the page URL and time, latest winning. The replay ingest seeds them into the replay browser session before pages open, with a documented method for agent-browser and one for the Playwright end-to-end test. Demo: a page whose behaviour depends on a stored value behaves the same on replay.

**Blocked by:** 06 WACZ export and first end-to-end test, 07 Milestone 0: replay proof on the customer SPA

**Status:** ready-for-agent

- [ ] The export contains snapshots per origin and the panel shows how many keys were captured
- [ ] The ingest produces a state agent-browser loads, and the end-to-end test seeds the Playwright context the same way
- [ ] A playground page that depends on a stored value behaves the same on replay; a minimal fixture page is added only if no playground behaviour depends on storage
- [ ] A unit test covers the snapshot serialiser
