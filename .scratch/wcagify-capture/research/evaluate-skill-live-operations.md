# The evaluate skill on a live target

Read on 2026-09-23 from every file under `skills/wcag-em-sample` and `skills/wcag-em-evaluate`. Line numbers are approximate; grep for the quoted text.

## Per-page browser work (the audit script)

Every group unit starts with: `set viewport 1280 900`, `open <sample url>`, `wait --load networkidle`, `snapshot -i` (`references/groups.md`). Each extra state gets its own axe run through `scripts/axe-page.mjs --report --sample --state`.

| Variant         | Commands                                                                                                 | Where                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Default         | `set viewport 1280 900`                                                                                  | groups.md                                                                                                                       |
| 200% zoom       | `set viewport 640 900` then `reload`                                                                     | groups.md, 1.4.4 step 2                                                                                                         |
| Steps between   | widths 1024, 853, 731, each followed by `reload`                                                         | 1.4.4 loop                                                                                                                      |
| 400% and reflow | `set viewport 320 900`, then `probes/reflow.js`                                                          | groups.md, 1.4.10                                                                                                               |
| Landscape       | `set viewport 900 400`; also `set device "iPhone 13"` + `reload`, then `set viewport 844 390` + `reload` | groups.md, 1.3.4                                                                                                                |
| Pointer         | `set device "iPhone 16"`, `set viewport 390 844`, `reload`                                               | 2.5.1 (says only iPhone 15/16/16 Pro/17, iPad, iPad Pro, Pixel 9, Galaxy S25 are accepted, contradicting "iPhone 13" elsewhere) |
| Text spacing    | `probes/text-spacing.js` injects styles; `reload` removes them                                           | 1.4.12                                                                                                                          |
| Reduced motion  | `set media reduced-motion`, `reload`, `probes/motion.js`, `set media`, `reload`                          | 2.2.2                                                                                                                           |
| Colour scheme   | `set media dark` (2.3.1), `set media light` (3.2.6)                                                      |                                                                                                                                 |
| Time limits     | `wait 30000` twice, compare `get url` and screenshots                                                    | 2.2.1                                                                                                                           |

Zoom is emulated only through viewport width plus reload; there is no browser-zoom command. About 34 reloads per sample across the groups. Ticket 01 turns this table into the single shared source.

Command counts across all skill files: `eval --stdin` 262, `screenshot` 71, `wait` 64, `press` 46, `snapshot -i` 45, `reload` 34, `find role` 29, `get attr` 27, `set viewport` 24, `open` 20, `highlight` 20, `focus` 19, `click` 17, `record start|stop` 15, `fill` 15, `get url` 13, `frame` 12, `read <url>` several, `network route "<url>" --abort`, `set device`, `set media`, `tab new|close|list`, `back`, `console`, `errors`, `dialog`.

## Operations that assume a live server (ticket 03 routes or records each)

- Every unit reopens the sample by absolute URL; recon checks "the target answers".
- Other pages in a second tab: `tab new; open <href>; get url; get title; get attr "meta[http-equiv='refresh']" content; read` (2.4.4); page P' (2.4.1); other samples (3.2.3, 3.2.4, 3.2.6, 2.4.5); `open <origin>/sitemap` (2.4.5); transcripts `open <href>; read; back` (1.2.1); `read <src>` for VTT tracks (1.2.3, 1.2.5); `read <url>` on other pages (1.3.3).
- HTTP-level checks outside the page: `fetch(location.href, {method:'HEAD'})` for the Refresh header (2.2.1); `fetch(u)` of every script URL from `performance.getEntriesByType('resource')` (2.5.4); `curl -sIL <transcript href>` (1.2.1); `curl <origin>/sitemap.xml` and `robots.txt` (2.4.5 and the sample skill).
- Server-side validation: 3.3.1 and 3.3.3 submit empty and wrong values and treat "a changed URL or a re-rendered page" as server-side detection. Real-effect submits are blocked with `network route "<url>" --abort` and recorded as cannot-tell (3.3.1, 3.3.4 "On a test environment skip the route").
- Cross-origin CSS: `document.styleSheets[].cssRules` in `probes/motion.js` and 1.4.4 step 1 lists cross-origin sheets as `unreadable`. On a single-proxy replay they become readable, so results differ from live; the report wording must say so (spec, ticket 03).
- Third-party frames: `frame "iframe[src*='youtube']"` (1.2.x), payment frames (3.3.7), CAPTCHA frames (3.3.8). The media group plays media.
- The sample skill crawls breadth-first from `links.internal` of each visited view (`scripts/inspect-view.js`, DOM only) and runs "the reload test": open the address on its own in a fresh session.
- `allowed-tools` of the evaluate skill: `Bash(agent-browser:*)`, `Bash(node:*)`, `Bash(ffmpeg:*)`. Neither `curl` nor `python` is allowed today; ticket 02's ingest command is Node or must be added.

## Credentials and environments (exact text)

- Sample skill: "Credentials come from the user and enter the browser through `agent-browser auth save <name> --url <login-url> --username <user> --password-stdin`, then `agent-browser auth login <name>`." "Parts behind a login or needing data are entered with the user's credentials or noted as inaccessible."
- Evaluate skill: "The target reachable from this machine; credentials and test data from the user, who speaks for the commissioner." Workers read `.notes/sample.md` for states, processes, cursory checks, credentials and what stayed inaccessible. The evaluate skill never runs `auth login` itself; each worker opens a fresh named session.

## Outputs and conventions

- Evidence: `.notes/audit/evidence/<sample>-<slug>.png` via `highlight` + `screenshot`; `record start <path>.webm` for motion. Recon writes `evidence/<id>-full.png`, `recon/<id>-<probe>.json`, `recon/<id>-tree.txt`, `recon/<id>-states.md`.
- Findings: `.notes/audit/findings/<sample>--<group>.md` with an Outcomes table (SC, Outcome, Certainty, Evidence) and F-numbered findings. Outcomes are passed, failed, cannot-tell (reason: "needs a human or assistive technology"), not-present.
- Issues: `scripts/add-issue.mjs` from `.notes/audit/drafts/<slug>.md`; frontmatter `title, sc, sample, severity?, type?, difficulty?, images[]`; images become WebP, videos GIF; files land in `<project>/uploads/<report-slug>/`. The SKILL.md line saying `public/uploads` is stale.
- Plan: `scripts/plan-audit.mjs` writes `plan.json`; units are `recon`, then `structure, keyboard, visual, motion, pointer, forms, media` per sample, then `consistency`, `process/<slug>`, `compare`. `--done`, `--skip`, `--reset` change status; `--unit` prints a unit's brief.
- Workers: `export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix wcag-em-<unit>)"`, `agent-browser close` at the end; the conductor runs `agent-browser close --all`. One unit per worker, one fresh context each; units of different samples run in parallel. The worker brief (`references/worker-brief.md`) is where a worker would learn replay mode (ticket 03).
- Report schema: `sample[]` entries are `{title, id, url, description}`; `check-report.mjs` warns when `url` is not absolute http(s). Process samples are written as `<process>, step n/m: <action>` in `description`, parsed by `plan-audit.mjs`. `evaluation` has no capture or provenance field (ticket 17).
- `.notes/` beside a report is gitignored: never commit credentials or captures there.
