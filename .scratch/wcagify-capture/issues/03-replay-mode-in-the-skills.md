# 03: Replay mode in the skills

**What to build:** Workers know they are on a replay and never reach a live server by accident. A replay declaration lives in the evaluator notes; the worker brief tells every worker to read it and set the proxy environment. Each operation that reaches a server outside the page (no-browser reads, shell fetches of sitemap and robots, the HEAD request for a refresh header, script downloads) is routed through the proxy or recorded as a miss with defined wording. A new cannot-tell reason, "not in the capture", is added to the outcome vocabulary, distinct from "needs a human or assistive technology", with the rule that it applies only after the second gap-fill round.

**Blocked by:** 02 Replay ingest and proxy command

**Status:** ready-for-agent

- [ ] The sample skill and the evaluate skill run to completion against a replay of a public site with no direct traffic to the live site (proxy log and a network monitor confirm)
- [ ] Every live-assuming operation is either proxied or produces a recorded miss line in the findings
- [ ] The "not in the capture" outcome is in the outcome table with its wording and the gap-fill-round rule
- [ ] The check-report script accepts the new outcome
- [ ] The hand-over template records replay facts: packages used, proxy, tool versions
