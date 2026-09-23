# WCAGify Capture

Status: ready-for-agent
Type: spec
Vocabulary: `CONTEXT.md` at the repo root. Use those terms in issues, code and tests.

## Problem Statement

focusring evaluates closed-source web apps. Before an evaluation can start, the evaluator needs a working way into the target: a test account, VPN or IP allow-listing, a staging environment, and someone at the commissioner who can arrange all of it. That takes days or weeks, and it stalls every audit of an app that sits behind a login. The commissioner, for their part, is asked repeatedly for access, credentials and environments, and has to keep them working for the whole audit.

The audit itself cannot be scaled down to fit. The evaluate skill needs the real target: it reloads every sample page at seven viewports and under phone user agents, switches media modes, opens linked pages, submits forms with wrong values, and walks processes step by step. Any substitute that does not behave exactly like production for those actions produces a report the evaluator cannot stand behind.

## Solution

WCAGify Capture is a Chromium extension the commissioner installs once. Everything the evaluator needs leaves the commissioner as a zip, the capture package, and nothing is required of them while the evaluation runs.

The commissioner opens the extension's side panel, starts an exploratory capture, and clicks through their target while logged in. The extension records every request and response the browser exchanges with the target, exactly as production served them. Export produces a capture package.

The evaluator ingests the package and replays it under the original URLs, so the audit skills browse it as if it were live. From the replay the evaluator selects the sample and produces a walk-list: the pages, states and processes the audit will cover. The commissioner loads the walk-list into the extension. In walk-list mode the extension guides them through every item and, for each page, performs the audit script itself: every viewport, user agent and media mode the evaluation uses, the reflow and text-spacing variants, and the safe form probes. It records all of it and shows what is still missing. Export produces the walk-list capture package.

The evaluator runs the full evaluation against the replay. Whatever the audit requested that the capture lacked becomes a gap list. The commissioner loads the gap list; the extension fetches every gap while logged in and exports an addendum. After at most two gap-fill rounds the evaluation completes with no criterion left undecided because of the capture, and the report reads as if it had been made against production.

## User Stories

1. As a commissioner, I want to install WCAGify Capture from a file the evaluator sends me, so that I do not depend on a web store listing or on my IT department approving a store extension.
2. As a commissioner, I want the extension to work in Chrome, Edge, Brave, Arc and Vivaldi, so that I can use the browser my organisation already runs.
3. As a commissioner, I want the side panel in Dutch or English, following my browser or my choice, so that I understand every step.
4. As a commissioner, I want to start an exploratory capture with one action and then simply use my target as I normally would, so that I do not need to understand what the evaluator needs.
5. As a commissioner, I want to see clearly that a capture is running and which tabs it covers, so that I never record something by accident.
6. As a commissioner, I want the capture limited to the origins of my target, so that other sites I open during the session are never recorded.
7. As a commissioner, I want to pause and resume a capture, so that an interruption does not force me to start over.
8. As a commissioner, I want to see how many views and requests were recorded so far, so that I know the capture is doing something.
9. As a commissioner, I want an explanation, before I start, of why the browser will show a "debugging this browser" bar and what happens if I close it, so that I do not abort the capture unknowingly.
10. As a commissioner, I want the capture to survive me closing the side panel, so that the panel is a control surface and not a requirement.
11. As a commissioner, I want to be told to use a test account and, where possible, a dedicated browser profile, so that no personal data of real users ends up in the package.
12. As a commissioner, I want to load a walk-list the evaluator sent me, so that I know exactly what to capture and when I am done.
13. As a commissioner, I want each walk-list item to say what to do in plain words (open this page, reach this state, walk this process to this step), so that I can follow it without training.
14. As a commissioner, I want the extension to perform the audit script on each walk-list page by itself, so that I do not have to reload pages at seven widths and in dark mode by hand.
15. As a commissioner, I want to see which walk-list items are done, which are partly done and which are missing, so that I can finish the list in one sitting.
16. As a commissioner, I want form probes that could have a real effect (an order, a payment, a message, an account) to be blocked, so that recording never changes anything in my production system.
17. As a commissioner, I want to review what will be redacted before I export, so that I know what leaves my organisation.
18. As a commissioner, I want session cookies, authorization headers and my login password removed from the package at export, so that the package cannot be used to log in as me.
19. As a commissioner, I want the export to produce one zip file that I download and send however my organisation allows, so that no data is uploaded anywhere by the extension.
20. As a commissioner, I want the package name to say what it contains (target, kind of capture, round, date), so that I and the evaluator can tell packages apart.
21. As a commissioner, I want to load a gap list and have the extension fetch the gaps while I am logged in, so that a second round costs me minutes, not another full walk.
22. As a commissioner, I want an addendum package to be small and clearly linked to the package it extends, so that I do not resend everything.
23. As a commissioner, I want to know, at export, that the package is complete for the walk-list I was given, so that I am not asked for a third round.
24. As a commissioner, I want the extension never to send anything to any server, so that I can answer my security officer's questions with a plain no.
25. As an evaluator, I want to ingest a capture package with one command and get a running replay, so that setting up a closed target takes minutes.
26. As an evaluator, I want the replay to serve the original absolute URLs, so that the sample skill and the evaluate skill work unchanged on it.
27. As an evaluator, I want the ingest to validate the package (structure, hashes, redaction report, package version) and refuse a broken one with a clear message, so that I never audit a corrupt capture.
28. As an evaluator, I want to combine an exploratory package, a walk-list package and addenda into one replay, so that later rounds add to, rather than replace, what I have.
29. As an evaluator, I want the sample skill to run against an exploratory replay and pick the sample exactly as it would on a live site, so that the method is unchanged.
30. As an evaluator, I want to turn the sample and the process notes into a walk-list with one command, so that the commissioner gets an exact list rather than an email.
31. As an evaluator, I want the walk-list to carry, for each form, whether its probes are safe or must be blocked, so that the commissioner's extension never triggers a real effect.
32. As an evaluator, I want the evaluate skill's workers to know they are on a replay, so that operations that would reach a live server are routed through the replay or recorded as misses instead of failing silently.
33. As an evaluator, I want a gap list produced automatically from everything the evaluation requested that the replay did not have, with the sample, state and unit that triggered each miss, so that I never write one by hand.
34. As an evaluator, I want a miss that survives two gap-fill rounds recorded as a distinct outcome, "not in the capture", so that it is never confused with a criterion that needs a human.
35. As an evaluator, I want the report to record that it was evaluated on a capture, with the packages' identities and dates, so that a reader knows what was audited.
36. As an evaluator, I want to see where a replay differs from live by construction (cross-origin stylesheets are readable, no live third parties), so that I can word findings accordingly.
37. As an evaluator, I want the evidence, screenshots and recordings produced on a replay to look like the production site, so that the commissioner recognises every finding.
38. As an evaluation worker, I want the replay to answer each reload at the requested viewport, user agent and media mode with what production served under those conditions, so that responsive and user-agent-dependent behaviour is audited faithfully.
39. As an evaluation worker, I want a recorded form submission with empty or invalid values to replay the server's real validation response, so that error identification and suggestion criteria can be decided.
40. As an evaluation worker, I want every process to walk to its last safe step on the replay, so that process units complete.
41. As an evaluation worker, I want a request the capture lacks to fail fast and visibly, so that I can record the miss and move on rather than wait on a timeout.
42. As a WCAGify maintainer, I want the extension on the same stack and conventions as the existing issue extension, so that one team can maintain both.
43. As a WCAGify maintainer, I want the capture package format versioned and documented, so that the extension and the evaluator tooling can evolve independently.
44. As a WCAGify maintainer, I want one end-to-end test that exercises the package from capture to replay, so that a regression on either side is caught in CI.
45. As a WCAGify maintainer, I want the replay proof on a real customer app to gate further investment, so that we do not build a product on an approach that fails on real SPAs.

## Implementation Decisions

### Milestone 0: the replay proof gates everything else

Before the extension is built beyond a recorder spike, the approach is proven on a real customer SPA with a test account. The capture is produced with off-the-shelf tooling (pywb's recording proxy driven by agent-browser performing the audit script, or ArchiveWeb.page), replayed with pywb in proxy mode, and the full sample and evaluate skills run against it, patched only where an operation assumes a live server. Pass bar: after at most two gap-fill rounds, every unit completes, every process reaches its last safe step, and no criterion is left cannot-tell because of the capture. A fail stops the work and reopens the approach with the user.

### Product boundaries

- A new package in the monorepo, `packages/capture-extension`, product name WCAGify Capture. Manifest V3, Vite with the crxjs plugin, Vue 3, Nuxt UI v4 through its Vite plugin, the same custom i18n composable and storage-backed singleton composables as the issue extension, a side panel as the only UI. Chromium browsers only.
- Distribution for pilots: load-unpacked build and a packed `.crx`, attached to the GitHub release like the issue extension's zip. No web store listing in this spec.
- Delivery of the package: download only, through the browser's download of a generated zip. The extension makes no network request of its own to any server.
- The old `feature/focusring-web-share` branch is not reused.

### Recording

- Recording uses the extension debugger API on each tab in scope: the Network domain for request and response metadata, response bodies fetched when loading finishes, plus the Page domain for navigation events. Bodies are written as WARC records as they arrive, streamed to IndexedDB rather than held in memory, so a long capture does not exhaust the service worker.
- A capture has a scope: the set of origins derived from the tab the commissioner starts it on, extended to origins the target loads resources from during the session. The extension attaches only to tabs within scope, never adopts tabs the commissioner opens elsewhere, and detaches on navigation out of scope. Host permissions in the manifest stay broad because the debugger API ignores them; the allowlist is enforced in code.
- Tabs under capture are marked non-discardable so the browser does not unload them mid-session. The debugger attachment keeps the service worker alive; capture state (scope, mode, walk-list progress) lives in extension storage so the panel can be closed and reopened.
- Client-side state that a WARC does not carry is captured alongside it: a snapshot of localStorage and sessionStorage per origin at each recorded page load. The package carries these snapshots; the ingest tooling seeds them into the replay browser's session before opening a page.
- WebSocket and server-sent-event traffic is recorded as frames for evidence but is not replayable; a target that depends on it for audited behaviour surfaces as capture misses. This is a known limit of every archive format and is stated in the package's README.

### Modes

- Explore mode: no walk-list. The panel shows the scope, a live count of views and requests recorded, pause and resume, and export. Guidance text asks the commissioner to visit every part of the target they consider in scope and to load important pages directly by address, not only by clicking, because the audit opens sample pages by URL.
- Walk-list mode: the commissioner loads a walk-list file. The panel lists its items grouped by sample page and process. Each item carries a plain-language instruction. For page items the extension opens the URL, waits for network idle, and runs the audit script. For state items it asks the commissioner to reach the state, then records it and runs the audit script again on that state. For process steps it asks the commissioner to perform the action and stops at the last safe step. An item is done when the recorded requests match what the item needs; the panel shows done, partial and missing.
- Gap-fill mode: the commissioner loads a gap list. The extension fetches each gap while logged in, using the same tab and emulation conditions the gap records (viewport, user agent, media), and exports an addendum package that names the package it extends.

### The audit script

The deterministic browser work the evaluate skill performs per page, reproduced by the extension so the capture contains what the audit will request:

- Viewports: 1280 by 900, 1024, 853, 731 and 640 wide at 900 high, 320 by 900 for reflow, and 900 by 400 landscape. Each is a full reload with device metrics emulated.
- Devices: the phone presets the skills use, with the matching user-agent override, each a reload, then a reload back at the desktop user agent.
- Media: dark and light colour scheme, reduced motion, each a reload.
- Injected variants: the 1.4.12 text-spacing styles applied after load, then removed by a reload.
- Safe form probes for every form on the page: submit with empty required fields, submit with invalid values in typed fields. A probe is only performed when the walk-list marks the form as safe. Forms marked unsafe are submitted with the request aborted at the network layer, mirroring what the skills do on a live site, and the abort is recorded.
- The script's exact sequence is generated from a single table shared with the evaluator tooling, so a change to the skills' viewports or presets updates both sides.

### Redaction at export

- Removed from every record: Authorization, Cookie and Set-Cookie headers. The recorded login request has its password field value replaced. Tokens in URLs are kept, because replay looks requests up by URL, and are listed in the redaction report.
- The panel shows the redaction report before export and explains that the commissioner should have used a test account.
- The report is embedded in the package manifest, so the evaluator sees what was removed.

### Capture package format

- A zip with a versioned layout: a WACZ file holding the WARC records and their index, a manifest, a README for humans, and the storage snapshots.
- The manifest records the package format version, extension and browser versions, capture kind (exploratory, walk-list or gap-fill), round number, the package it extends if any, capture start and end, target origins, the walk-list with per-item status when present, the audit-script log (which variants ran on which page), the redaction report, and content hashes.
- File name: target host, kind, round and date.
- Packages of one target combine: the ingest tooling merges an exploratory package, a walk-list package and addenda into one replay collection, later records winning on identical URLs.

### Evaluator-side tooling, inside the skills

- An ingest command that validates a package, unpacks it into a pywb collection, and starts pywb in proxy mode with content rewriting off, with the CA and proxy settings agent-browser needs (proxy URL, ignore HTTPS errors). It prints the environment a worker sets. Python and pywb are accepted dependencies of the evaluator toolchain.
- A replay declaration in the report's evaluator notes, which the worker brief tells every worker to read, so a worker knows it is on a replay and which proxy to use.
- Skill-text changes limited to the operations that reach a live server outside the page: fetching a URL without the browser, shell fetches of sitemap and robots, HEAD requests for refresh headers, script downloads. Each is either routed through the proxy or, when it cannot be, recorded as a miss.
- A gap-list collector that turns the proxy's miss log into a gap list: URL, method, viewport, user agent and media at the time, the sample, state and unit that triggered it.
- A walk-list emitter in the sample skill that turns the sample list and the process and state notes into the walk-list file, with a safe or unsafe mark per form.
- A new cannot-tell reason, "not in the capture", used only after the second gap-fill round, distinct from the existing "needs a human or assistive technology".
- Provenance in the report: an optional capture block in the report frontmatter listing the packages (identity, kind, round, date, hash) and the replay tool version. The schema and the report header show it.
- The device-preset names the skills use are aligned with what agent-browser accepts, since the audit script and the skills share that table.

### Interfaces between the sides

- Walk-list file: JSON, one item per sample page, state or process step, with an id, kind, URL, title, sample id, plain-language instruction, and for forms a safe flag. Written by the evaluator tooling, read by the extension.
- Gap list file: JSON, one entry per miss with URL, method, emulation conditions and the triggering sample, state and unit. Written by the evaluator tooling, read by the extension.
- Capture package: as above. Written by the extension, read by the evaluator tooling.

## Testing Decisions

A good test exercises external behaviour at the package boundary: what the extension exports for a given session, and what the replay serves for a given package. Tests never assert on debugger-protocol message sequences, service-worker internals or pywb's file layout.

Seams:

1. End to end across the capture package, the primary seam. The Robot suite loads the unpacked extension into Chromium against the playground behind its admin login, runs an exploratory capture, loads a walk-list, runs a walk-list capture with the audit script, and exports. A vitest e2e test ingests that package with the evaluator tooling, starts pywb, and asserts through the proxy with Playwright that the original URLs replay, that the viewport and user-agent variants are present, that a recorded invalid form submission replays the playground's validation response, and that a request deliberately left out of the capture appears in the gap list and is served after a gap-fill addendum is ingested. The replay assertions use Playwright so CI does not depend on agent-browser; a manual check with agent-browser is part of Milestone 0, not CI.
2. Unit tests for pure functions on the existing vitest and happy-dom pattern with a stubbed `chrome` global: WARC and WACZ building, redaction, manifest schema, walk-list and gap-list parsing, audit-script sequence generation from the shared table.

Prior art: the Robot suite that drives the issue extension against the playground in a persistent Chromium context; the vitest e2e suite that scaffolds a project, starts dev and preview servers on fixed ports and drives Playwright; the issue extension's unit tests that stub the `chrome` global and import the module under test dynamically.

CI needs Python and pywb in the e2e job. The playground is the fixture target; a dedicated fixture app is added only if a behaviour the test needs (a user-agent-dependent response, responsive images) is missing from the playground.

## Out of Scope

- Native mobile apps.
- An upload intake into WCAGify; delivery is download only.
- A live session through the extension (forwarding the DevTools protocol to the evaluator). Researched and viable, rejected for the offline requirement.
- Firefox.
- A Chrome Web Store listing and its permission justification.
- Replay of streaming media, WebSocket and server-sent-event behaviour.
- Automatic crawling by the extension.
- Fetching unrecorded requests from the live site during replay, including public third-party origins.
- Renaming the existing issue extension.

## Further Notes

- A recording can only contain what passed through the commissioner's browser. The audit script and the gap-fill loop exist to make the capture complete for everything the audit does; they cannot make it complete for arbitrary actions. The proof bar is stated in terms of the audit, not of the app.
- Known replay differences from live, to be worded in findings: cross-origin stylesheets become readable on a single-proxy replay; third-party embeds (video players, payment frames, CAPTCHAs) replay only as captured.
- Authenticated SPAs are the risk: CSRF tokens, nonces and timestamps in requests, and responses that vary by user agent. The exploratory replay and Milestone 0 measure how much of that the fuzzy matching absorbs and how much the gap-fill loop has to carry.
- The debugger bar cannot be suppressed; dismissing it detaches the tab until the next navigation. From Chrome 155 an enterprise policy can block the attachment altogether; the panel must report that failure in plain words.
- Session-level facts gathered during charting (agent-browser flags and connect modes, pywb proxy and recording modes, the MV3 debugger limits, the operations in the skills that assume a live target) are in the conversation that produced this spec and should be captured into the repo's research notes by the first implementation session.
