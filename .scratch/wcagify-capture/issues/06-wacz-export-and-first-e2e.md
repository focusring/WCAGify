# 06: WACZ export and first end-to-end test

**What to build:** Response bodies are fetched as each response finishes loading and written as WARC records streamed to IndexedDB, never held in memory. Export assembles a WACZ (records, index, pages list, data package with hashes) and downloads it. The first end-to-end test crosses the whole path: the Robot suite loads the unpacked extension into Chromium, captures a playground page and exports; a vitest e2e test ingests the file with the replay command, starts pywb, opens the original URL through Playwright via the proxy and asserts the page renders with its stylesheet and one API response.

**Blocked by:** 05 Extension scaffold with recording counter, 02 Replay ingest and proxy command

**Status:** ready-for-agent

- [ ] A capture of the playground home page produces a WACZ that pywb ingests without errors
- [ ] A capture of two hundred or more requests including image bodies completes without the service worker dying
- [ ] The Robot plus vitest end-to-end test passes locally and in CI
- [ ] Unit tests cover WARC record writing and WACZ assembly with fixtures
