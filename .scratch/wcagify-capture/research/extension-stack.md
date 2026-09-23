# The issue extension's stack, to copy for the capture extension

Read on 2026-09-23 from `packages/browser-extension`. The capture extension copies these conventions; no shared package is extracted (spec decision).

## Package

- `package.json`: private, ESM, scripts `dev: vite`, `build: vite build`, `test: vitest run`, `typecheck: tsc --noEmit`. Dependencies `@nuxt/ui` (catalog), `vue`, `zod` (catalog), Tiptap only for the rich-text editor (not needed for capture). Dev: `@crxjs/vite-plugin`, `@types/chrome`, `@vitejs/plugin-vue`, `happy-dom`, `tailwindcss` (catalog), `typescript` (catalog), `vite`, `vitest` (catalog).
- Catalogs live in `pnpm-workspace.yaml`; the Tiptap override block there must stay in sync if Tiptap is used; `trustPolicyExclude` lists `rollup` because crxjs pins it.
- `tsconfig.json`: ESNext, `moduleResolution: bundler`, strict, `types: ['chrome']`, path alias `#build/ui/*` to Nuxt UI's runtime so Nuxt UI works outside Nuxt.
- Root `package.json` scripts `ext:dev` and `ext:build` point at the issue extension; the root `test` script filters packages by name; `knip.json` needs a block per package (entries: service worker, content scripts, popup main, manifest config; project `src/**/*.{ts,vue}`).
- CI (`.github/workflows/ci.yml`) runs lint, fmt:check, knip, typecheck, test. Husky pre-commit runs lint-staged (oxlint + oxfmt on ts/vue/js/mjs; oxfmt on json/md/css), then knip, then typecheck.
- Release (`.github/workflows/release.yml`) on a `v*` tag builds, zips `dist/` from inside the folder so `manifest.json` is at the root, excludes `*.map`, and attaches `wcagify-extension-<tag>.zip`. No store upload, no Firefox build.

## Manifest and build

- `manifest.config.ts` with `defineManifest` from crxjs: `manifest_version: 3`, version from `package.json`, icons 16/48/128 in `src/assets`, `action` without popup (clicking opens the side panel), `background: { service_worker, type: 'module' }`, `permissions: ['activeTab','tabs','storage','sidePanel']`, `host_permissions: ['http://localhost/*','https://*/*']`, CSP `script-src 'self'; object-src 'self'; img-src ...`, `side_panel.default_path: 'src/popup/index.html'`, content script at `document_idle`.
- The capture extension adds `debugger`, `unlimitedStorage` and `scripting`, and `http://*/*` host permission for local targets; CSP may need `'wasm-unsafe-eval'` if a WASM zip or hash library is used.
- `vite.config.ts`: plugins `vue()`, `ui({...})` from `@nuxt/ui/vite` with `colorMode: false` and large contrast-tuned theme overrides for button, badge, alert, input and selectMenu (copy them), then `crx({ manifest })`. Nuxt UI's plugin generates `auto-imports.d.ts` and `components.d.ts` (gitignored). `chunkSizeWarningLimit: 1600`.
- `src/popup/style.css`: `@import 'tailwindcss'; @import '@nuxt/ui';`, Public Sans font faces, an `@theme static` palette, light and dark `--ui-text-*` tokens, a double-outline `:focus-visible` style. Icons are `i-lucide-*`.

## Runtime patterns

- Side panel app: `app.use(ui)` in `main.ts`, root wrapped in `<UApp>`, mounted only after the i18n `ready` promise resolves.
- i18n: `src/i18n/index.ts` exports `en` and `nl` nested message objects, `Messages = DeepStringify<typeof en>`, `Locale`, `supportedLocales`, `localeLabels`. `useI18n()` (`src/composables/useI18n.ts`) keeps a module-level `locale` ref loaded once from `chrome.storage.local` key `locale`, persisted by a watcher, and returns `{ locale, t, messages, ready }` with typed dotted keys. Templates call `t()`; there is no global `$t`.
- State: no Pinia. Composables hold module-level singleton refs, load once from `chrome.storage.local` through a memoised `load()`, and persist through `watch` (`useSettings.ts`, `useColorMode.ts`).
- Messaging: side panel to content script via `chrome.tabs.sendMessage`, content script replies with `chrome.runtime.sendMessage`; a long-lived `chrome.tabs.connect` port whose `onDisconnect` tells the content script the panel closed. The service worker is minimal (icon theme, opens the side panel on action click). The capture extension moves real work into the service worker because `chrome.debugger` is unavailable to the panel page; the panel messages the worker.
- Active tab discovery: `chrome.tabs.query({active: true, currentWindow: true})`, skipping `chrome*` and `extension*` URLs.
- API calls to WCAGify: plain `fetch`, no auth, discovery on localhost ports. The capture extension makes no network calls at all.

## Tests

- `vitest.config.ts`: `test/**/*.test.ts`, environment `happy-dom`. Pattern: `Object.defineProperty(globalThis, 'chrome', { value: stub })`, then a dynamic `await import(...)` of the module under test so the stub exists first. Tests: unique selector, instance discovery (mocked fetch), settings merge.
- Robot Framework suite at `test/robot/`: Python 3.10+, robotframework-browser 19.14.2; loads the unpacked `packages/browser-extension/dist` into a persistent Chromium context against the playground (`WCAGIFY_BASE_URL`, default `http://localhost:3000`; `WCAGIFY_HEADLESS=true` for `--headless=new`). Run: `pnpm ext:build`, `pnpm dev`, `pnpm test:robot`. Not in CI today.
- vitest e2e at `test/e2e/`: `setup/global-setup.ts` builds the layer and the CLI, packs a tarball and scaffolds a project under the temp dir; `setup/test-utils.ts` has `startDevServer(path, port)` (`npx nuxt dev --port`) and `startPreviewServer` (`node .output/server/index.mjs`); fixed ports per suite (3101 to 3106); `hookTimeout` 30 minutes; 1 worker on CI, 2 locally. `.github/workflows/e2e-tests.yml` runs it.
- Playground admin auth: one admin secret and a signed cookie `wcagify-admin` (`server/middleware/admin-auth.ts`); `POST /api/issues` validates with the issue schema and returns 400 on invalid input (a safe form probe target); `POST /api/issues/upload` takes images up to 2 MB.
