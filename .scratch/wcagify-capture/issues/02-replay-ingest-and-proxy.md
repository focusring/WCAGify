# 02: Replay ingest and proxy command

**What to build:** An evaluator command inside the skills that takes one or more WACZ files, builds a pywb collection, starts pywb in proxy mode with content rewriting off, and prints the environment agent-browser needs (proxy address, ignore HTTPS errors, certificate). CI installs Python and pywb. Demo: capture a public page with ArchiveWeb.page, ingest it, open the original URL through agent-browser on the replay and run the axe script.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The command accepts several WACZ files and produces one collection; running it again with an extra file adds to the collection
- [ ] Proxy mode serves the original absolute URLs, including a second host present in the archive
- [ ] With the printed environment, open, reload, set viewport, set device, set media, tab new, a11y and the axe script all work against the replay
- [ ] The command's documentation states whether the no-browser read and shell fetches honour the proxy, verified by trying them
- [ ] An unrecorded URL answers quickly with a not-found response and the proxy logs the miss
- [ ] CI installs Python and pywb and runs a smoke test that ingests a fixture WACZ and fetches one URL through the proxy
