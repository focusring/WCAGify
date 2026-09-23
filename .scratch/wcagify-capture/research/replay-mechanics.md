# Replay mechanics: agent-browser, pywb, MV3 capture

Gathered 2026-09-23 from the agent-browser README, its bundled skill docs and binary strings (0.37.1 installed; 0.38.1 latest), pywb's manual, Chromium source and Chrome extension docs.

## agent-browser (Rust CLI, Chrome over CDP, no Playwright)

- Proxy: `--proxy <url>` or `AGENT_BROWSER_PROXY`; `--proxy-bypass` or `AGENT_BROWSER_PROXY_BYPASS`; falls back to `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` (since 0.22). Config file `agent-browser.json` accepts `proxy`, `proxyBypass`, `ignoreHttpsErrors`, `profile`. Maps to Chrome's `--proxy-server` and `--proxy-bypass-list`.
- Chrome bypasses proxies for loopback unless `--proxy-bypass-list="<-loopback>"` is passed (use `--args`). Captures of the playground on localhost need this or a hosts alias.
- TLS: `--ignore-https-errors`. `--ca-cert <path>` exists since 0.35 but its first implementation excludes macOS, `--profile` and `--cdp`; on macOS use `--ignore-https-errors`.
- Chrome args: `--args "<comma or newline separated>"` or `AGENT_BROWSER_ARGS`; `--executable-path`; `--extension <path>` (repeatable) loads unpacked extensions; `--profile <name|path>` persists cookies, IndexedDB, service workers.
- CDP mode: `--cdp <port|url>`, `--auto-connect`, `agent-browser connect <port|url>`. A port is probed at `/json/version` for `webSocketDebuggerUrl`; a URL is connected directly; liveness is a `Browser.getVersion` round trip. `--allowed-domains` is rejected in CDP mode.
- Sessions: `session id --scope worktree|cwd|git-root --prefix <p>`; `--session <name> --restore` auto-saves cookies and localStorage; `state save` and `state load`; `auth save <name> --url --username --password-stdin` then `auth login <name>`.
- `set device <name>` changes device metrics and the user agent; only `close` then `open` restores the desktop user agent. The README shows "iPhone 12", "iPhone 14", "iPad Pro"; no enumerated list is published. The skills currently use "iPhone 13" and "iPhone 16": verify against the daemon before relying on a name (ticket 01).
- `network route <url> [--abort | --body <json>] [--resource-type <csv>]` only aborts or stubs. No fulfil-from-file or HAR replay. `network har start|stop` records only.
- `read <url>` fetches without launching Chrome; whether it honours `--proxy` is unverified. Several criterion files use it (see the live-operations note). Ticket 02 must test it.
- `a11y --json --tags ...` runs the vendored axe-core 4.12.1 through CDP across the frame tree; no script injection, so a strict CSP does not block it.

## pywb

- Proxy mode: `wayback --proxy <coll>` or config `proxy: {coll, default_timestamp, recording, enable_banner, enable_content_rewrite, ca_name, ca_file_cache}`. "No url rewriting is performed"; the browser sees the original absolute URLs. Set `enable_content_rewrite: false` to drop the banner and head insert.
- HTTPS: pywb provides its own CA and generates a certificate per host; CA at `./proxy-certs/pywb-ca.pem`, downloadable at `http://wsgiprox/download/pem` through the proxy.
- Unrecorded requests: 404 "Not Found" unless `recording: true`, in which case pywb fetches from live and writes a WARC. Recording mode plus agent-browser performing the audit script is the off-the-shelf way to produce an audit-shaped capture for Milestone 0.
- WACZ ingest: pywb 2.8 or later, `wb-manager add --unpack-wacz <coll> <file.wacz>`. Several WARC or WACZ files can be added to one collection; the index is rebuilt.
- Lookup is by URL and timestamp with fuzzy-match rules; request cookies are ignored. Set-Cookie replays on the original host through the default host-scope cookie rewriter with the identity URL rewriter.
- Cross-origin frames replay if captured, because every host goes through the one proxy.
- Miss log: pywb logs the not-found lookup; ticket 04's collector parses it. Ticket 02 records the exact log format and location.
- Python: pywb needs a Python 3 with pip; this machine has system Python 3.9.6 and no pipx or uv. Use `python3 -m venv` outside the repo, or a CI-installed pywb.

## Ruled out

- ReplayWeb.page and wabac.js: service-worker replay serves everything under its own origin at `/w/<coll>/<modifier>/https://...`. A service worker cannot answer for another origin, so `open https://app.example.com/` can never hit it.
- Playwright `routeFromHAR`: replays a HAR with embedded bodies (strict URL, method and POST-body matching, `notFound: 'abort' | 'fallback'`) but is unreachable from agent-browser, which has no Playwright. A HAR could be converted to WARC for pywb instead.
- warcprox playback: "rudimentary, not much used or maintained".

## MV3 capture limits (Chrome extension)

- `webRequest` gives headers only, never bodies; `webRequestBlocking` is unavailable to normal extensions; `declarativeNetRequest` cannot read bodies.
- Only `chrome.debugger` with the Network domain and `Network.getResponseBody` reads bodies. It shows the "is debugging this browser" bar, which cannot be suppressed except for policy-installed extensions; dismissing it detaches the tab until the next navigation. One debugger per tab; a tab with DevTools open cannot be attached.
- Since Chrome 125 flat sessions: events for child targets (out-of-process iframes, workers) arrive with a `sessionId`; auto-attach reaches immediate child frames only.
- Chrome 155 (stable 6 October 2026): `chrome.debugger.attach` fails under enterprise `runtime_blocked_hosts` ("Host access is restricted by policy") and DLP screenshot policies. `ExtensionSettings.blocked_permissions` can block `debugger` outright. Ticket 08 reports these in plain words.
- Host permissions do not scope the debugger; the install warning is "Read and change all your data on all websites". Origin scoping is code in the extension.
- Service-worker lifetime: active debugger sessions (Chrome 118+) and open WebSockets (116+) keep the worker alive; alarms are 30 s minimum. Tabs can still be frozen or discarded: set `autoDiscardable: false` on captured tabs.
- `chrome.devtools.network.getHAR` needs DevTools open and omits bodies; not an option.
- ArchiveWeb.page (Webrecorder) is an MV3 extension shipping on the Web Store with `debugger`, `webRequest`, `unlimitedStorage`; it writes WARC to IndexedDB and exports WARC or WACZ. Check its licence before copying code (ticket 08's research in the spec).
- Fixture captures for tests: pywb recording mode, `wget --warc-file`, or warcio in Node (the old `feature/focusring-web-share` branch used warcio and fflate; the branch is not reused, per the spec).
