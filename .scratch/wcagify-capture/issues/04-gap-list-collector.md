# 04: Gap-list collector

**What to build:** A script that turns the proxy's miss log into a gap list: one entry per missing request with URL, method, the viewport, user agent and media mode in force at the time, and the sample, state and unit that triggered it. Workers make the correlation possible by logging their unit, sample and state with timestamps. Demo: run one unit against a replay with a deliberately missing resource and the gap list names it with its sample and unit.

**Blocked by:** 02 Replay ingest and proxy command, 03 Replay mode in the skills

**Status:** ready-for-agent

- [ ] The gap-list format is documented in the skill: one entry per miss, duplicates merged, emulation conditions included
- [ ] Misses raised inside a worker carry the triggering sample, state and unit; misses outside any worker are listed without them
- [ ] A unit test runs the collector over a fixture miss log and worker log
- [ ] The evaluate skill's conductor steps say when to run the collector and how to send the list to the commissioner
