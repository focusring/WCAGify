# Splitting out `@focusring/wcagify-reporter`

Contributor notes for the split of WCAGify's report rendering into its own package, so apps such as the focusring customer portal can render reports without WCAGify's admin, editor, share and Nuxt Content routes. The plan and its reasoning live in WCAGify-reporter's `docs/research/wcagify-split.md`; this file records what each step changed and what later steps must know.

## Step 0: admin auth allow-list

When `WCAGIFY_ADMIN_SECRET` is set, `server/middleware/admin-auth.ts` used to treat every path starting with `/__nuxt` as public. That prefix also matched Nuxt Content's `/__nuxt_content/<collection>/sql_dump.txt`, which returns a whole collection, and `/__nuxt_studio/`. Every report and issue on a locked instance could be downloaded.

### Public paths

| Path                                | Why a visitor needs it                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/_nuxt/`                           | the app's JavaScript and CSS chunks                                                                                                     |
| `/__nuxt_error`                     | Nuxt renders error pages by fetching it through the middleware; without it an unknown share link redirects to `/login` instead of a 404 |
| `/_i18n/`                           | translation messages loaded at runtime                                                                                                  |
| `/api/_nuxt_icon/`                  | icons; without it a password-protected share showed no icons after unlocking                                                            |
| share, login and admin-login routes | as before                                                                                                                               |
| `/_ipx/`, `/favicon.ico`            | kept for projects that add `@nuxt/image`, and the favicon                                                                               |

Not needed: `/__nuxt_island/` (no islands), `/_fonts/` (static, or a dev handler that runs before the middleware), Studio's paths (Studio is removed in step 0b). Data routes (`/api/*`, `/__nuxt_content/*`) answer 401 instead of redirecting to `/login`.

### The prerendered dumps

Nuxt Content marks `/__nuxt_content/<collection>/sql_dump.txt` as `prerender: true`, so a build writes each dump into `.output/public/`. Nitro's static handler runs before all server middleware, and on Vercel or Netlify the CDN serves the file directly, so narrowing the allow-list alone still left the dumps public. `src/module.ts` turns that prerender off in a `nitro:config` hook; the dumps now go through their server handler and the admin auth. The `/__nuxt_content/<collection>/query` endpoint, also public before, is locked too.

### Share pages and Nuxt Content's local fetches

Share pages do not load the client-side dump, but every server-side `queryCollection(event, …)` is a local `event.$fetch` POST to `/__nuxt_content/<collection>/query` that forwards the visitor's headers, and the cold-start integrity check fetches `sql_dump.txt` the same way. When the middleware lets a request through it sets `event.context.wcagifyAccessGranted`; Nitro passes the outer event's context to a local fetch as `req.__unenv__`, which a client cannot set. A `/__nuxt_content/` request whose outer request was let through is let through too. Only content routes inherit access this way; a plain global `$fetch` during server rendering passes no context.

This depends on Nitro internals (h3's `fetchWithEvent` and node-mock-http's `__unenv__`). If an upgrade changes them, the share e2e suite fails.

### Tests

`test/e2e/share.e2e.test.ts` has a "with an admin secret" block that starts a second server from the same build with `WCAGIFY_ADMIN_SECRET` and checks: 401 for a visitor and 200 for a signed-in admin on the reports and issues dumps; `/` redirects to `/login`; share links with and without a password work for a viewer without an admin session, with no 401 or login redirect on any request; an unknown share link shows a 404. `test/e2e/setup/test-utils.ts` gained `buildProject` and `startBuiltServer`. Keep this block passing through the later steps.

### Follow-ups not done

- The share page fetches `/api/share/${token}` with the decoded route parameter; wrapping it in `encodeURIComponent` would harden it.
- `/api/share/..%2F…` answers 500 instead of 404.
- `/_ipx/` stays listed although no module in the layer serves it.

## Step 0b: Nuxt Studio removed

`nuxt-studio`, its enabling condition, its dependency and catalog entry, its knip entry, the `shims/` folder with its Vite alias and `optimizeDeps` entry, and its documentation are gone. The allow-list needed no further change. Projects that still want Studio can add `nuxt-studio` to their own modules.

If `nuxt prepare` fails with "Could not load @nuxtjs/mdc" after pulling this change, run `pnpm install --force --frozen-lockfile`; a stale pnpm link record can survive the dependency removal. Fresh installs are fine.

## Step 1: core additions

Three framework-free modules in today's `packages/wcagify/src`, exported from the package root (`dist/index.js` still imports only zod and the package's own framework-free modules). Step 3 moves them into `@focusring/wcagify-reporter` unchanged.

| Module        | Exports                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `document.ts` | `reportDocumentSchema`, `issueDocumentSchema`, `minimarkSchema`; types `ReportDocument`, `IssueDocument`, `Minimark`, `MinimarkNode` |
| `teaser.ts`   | `reportTeaser`, `teaserSchema`; types `Teaser`, `TeaserReport`                                                                       |
| `uploads.ts`  | `rewriteUploadUrls`                                                                                                                  |

They are ports of WCAGify-reporter's temporary stand-in `packages/report-snapshot` (described in that repo's `docs/portal/report-publish.md`), so the portal and its publish CLI can switch to this package and get identical results. A check against every report in the playground's and WCAGify-reporter's Nuxt Content databases (`.data/content/contents.sqlite`, 7 reports, up to 159 issues) gave the same parse results, teasers and rewritten content from the stand-in (on 0.6.6) and from this build.

### Documents

`reportSchema` and `issueSchema` extended with the page fields Nuxt Content adds and the report components read: `title` (trimmed, not empty), `description?`, `path` and `body` (Nuxt Content v3's minimark tree: `{ type: 'minimark', value, toc? }`). A report's `path` must be `/reports/<slug>` with a `toSlug`-style slug, an issue's `/reports/<slug>/<file>`. Other fields of a Nuxt Content item (`id`, `stem`, `seo`, `meta`, `navigation`) are stripped. Step 2 types the components with `ReportDocument` / `IssueDocument`; the body type is declared here, not imported from `minimark`, so the core keeps zod as its only dependency. Whether Nuxt Content's generated item types are assignable to these is for step 2 to confirm with `pnpm typecheck`.

### The teaser

`reportTeaser(report, issues)` returns, for the report's `evaluation.targetLevel` and `targetWcagVersion`:

```json
{
  "wcagVersion": "2.2",
  "targetLevel": "AA",
  "findings": 3,
  "levels": [
    { "level": "A", "conforming": 30, "failed": 1, "total": 31 },
    { "level": "AA", "conforming": 23, "failed": 1, "total": 24 }
  ],
  "total": { "conforming": 53, "failed": 2, "total": 55 }
}
```

- `findings` counts the issues `groupIssuesByPrinciple` places under a criterion of the target, which is what `ReportContent` lists: tips (`sc: none`) are left out, and so are issues against a criterion outside the target version or level, or obsolete in 2.2 (4.1.1). This answers the split doc's open question 2 the way the stand-in did.
- The counts are the `all` counts of `scorecardByLevel`, per level up to the target and in total. No principles, no criterion numbers.
- `teaserSchema` is strict, so a stored teaser cannot carry anything else.

Deviations from the split doc's section 4, both taken from the stand-in because portal teasers are already stored in that shape: the levels are an array of `{ level, conforming, failed, total }` (not a `perLevel` object of full scorecards), and there is no separate `criteria` block (`total` holds the same met / failed / total; fully conforming is `total.failed === 0`). The function takes the target from the report instead of a third `target` argument, as the stand-in did; the portal refuses a report whose target differs from the order's before it compares teasers, so the results are the same. Its input is `TeaserReport` (`evaluation` target and `scStatuses`) plus `{ sc }[]`, so no other report content reaches it.

### Upload URLs

`rewriteUploadUrls(value, from, to)` replaces the prefix `from` with `to` in every string of a copy of `value`. The share route now imports it from `@focusring/wcagify` and passes `/api/uploads/<slug>/` and `/api/share/<token>/uploads/`; it still rewrites the issues only, as before. `server/utils/share-uploads.ts` is gone, so the Nitro auto-import `rewriteUploadUrls(value, reportSlug, token)` no longer exists: worth a changelog line for projects that used it from their own server code. Like the other server routes that import the package by name, the share route resolves `@focusring/wcagify` to `dist/`, so after pulling this step run `pnpm --filter @focusring/wcagify build` (the e2e setup and `pnpm install` do it already).

The share e2e suite now writes an issue with an `/api/uploads/example/…` image into the scaffolded report and checks that `/api/share/<token>` answers with the token-scoped URL and no `/api/uploads/`. Nothing covered the rewrite end to end before.

### Not ported from the stand-in

These stay portal-side for now, as `report-publish.md` planned: `reportSnapshotSchema` (`{ report, issues }` with every issue under the report's path), `referencedUploads`, `reporterUploadPrefix`, `reportImageRoute`, `imageContentType`. If the portal and the publish CLI should share `reportSnapshotSchema` from here, add it to `document.ts` in step 3.

### For later steps

- Step 2: type the components with `ReportDocument` / `IssueDocument` from `../../src/document` or the package root, and check that the share and report pages still typecheck with the Nuxt Content items they pass.
- Step 3: move `document.ts`, `teaser.ts`, `uploads.ts` and their tests (`test/unit/{document,teaser,uploads}.test.ts`) with the rest of the core; the share route's import becomes `@focusring/wcagify-reporter` or stays on the re-export.
- None of the split doc's `[verify]` risks is touched by this step.

## Step 2: components decoupled in place

The report components no longer depend on Nuxt Content, but nothing moved package yet. Step 3 can move the render set as it is.

### Document types

`ReportContent`, `ReportCoverPage`, `ReportHeader`, `ReportScorecard`, `ReportPrinciple`, `ReportGuideline`, `ReportSuccessCriterion`, `ReportIssue`, `ReportIssueFooter`, `ReportScope`, `ReportSample` and `useConformanceResult` take `ReportDocument` / `IssueDocument` from the package root instead of `ReportsCollectionItem` / `IssuesCollectionItem`. Only the pages and `ReportImportSlideover`, which stay in the full layer, still use the Nuxt Content types.

Nuxt Content's items were not assignable to the step 1 types. The only mismatch was `body.toc`: Nuxt Content types it as `Toc` from `@nuxtjs/mdc`, an interface, and an interface is not assignable to the index signature `z.looseObject({})` produces. `document.ts` now types the toc schema as `z.ZodType<object>`; parsing is unchanged (any object, kept as is). The playground typecheck proves the fit: `pages/reports/[...slug].vue` passes `queryCollection` results straight to `<ReportContent>`.

### `ReportMarkdown`

`app/components/ReportMarkdown.vue` replaces `ContentRenderer` at its three call sites (executive summary, tips, issue bodies). It takes the minimark `body`, converts it with `toHast` from `minimark/hast`, and renders it with `MDCRenderer`, imported from `@nuxtjs/mdc/runtime/components/MDCRenderer.vue` as `ContentRenderer` does. The `@nuxtjs/mdc` module is not registered, so no `/api/_mdc/highlight` route; `@nuxtjs/mdc` and `minimark` are now direct dependencies (catalog `core`, same versions Nuxt Content resolves).

Tag map, in increasing precedence: the prose map `ContentRenderer` uses, `@nuxtjs/mdc`'s runtime `components.map` when present (Nuxt UI's MDC names and Nuxt Content's `renderer.alias`), then the `components` prop (`ReportIssue`'s `ProseHNested` for headings). The prose names are resolved with literal `resolveComponent('LazyProseImg')` calls, which Nuxt's component loader replaces at build time with a dynamic import of whichever component won the name. That works whether or not the winner is global, and `MDCRenderer` awaits the loaders in its async setup, as it did for the lazy global components `ContentRenderer` resolved. The `Lazy` prefix matters: with plain `resolveComponent('ProseImg')` all 23 prose components landed in the share page's initial chunk, its hydration got slower, and the share e2e test "unlocks a password-protected share for a viewer without an admin session" failed in all three suite runs (see the follow-ups). `h5` and `h6` are left out of the map because Nuxt UI has no `ProseH5`/`ProseH6`; under Nuxt Content `MDCRenderer` still maps them to `@nuxtjs/mdc`'s own from its runtime config, so the full layer renders them as before. Without `@nuxtjs/mdc` (the portal) they render as plain `h5`/`h6`.

### Prose overrides

`ProseImg`, `ProsePre` and `ProseHNested` moved from `app/components/content/` (registered only by Nuxt Content) to `app/components/prose/`, which the layer's `nuxt.config.ts` registers itself with `global: true`, next to `app/components`. Setting `components` in a layer replaces that layer's default directories, hence both entries, with absolute paths built from the config file's own directory, like the layer's `css` entries. Layer directories get priority `layerCount - index` (at least 1), Nuxt UI's prose directory 0, so the layer's overrides win over Nuxt UI's and lose to the project's.

`[verify]` resolved, no breaking change. Checked on the playground with `nuxt prepare` (`.nuxt/components.d.ts`) and at runtime in a dev server, with a marker `ProseImg` in the project:

| Project override                      | Before (main)      | After              |
| ------------------------------------- | ------------------ | ------------------ |
| `app/components/ProseImg.vue`         | project's wins     | project's wins     |
| `app/components/content/ProseImg.vue` | project's wins (*) | project's wins (*) |

(*) with Nuxt's "Two component files resolving to the same name" warning, before and after: Nuxt Content registers the project's `components/content` at priority 1, equal to the layer's, and it comes first. Without Nuxt Content (the portal) only `app/components/` applies.

`ProseImg`, `ProsePre` and `ProseHNested` are now global components. Under Nuxt Content they were not: Content's registration has no `global`, so its `ProseImg` replaced Nuxt UI's global one and was reachable only through `ContentRenderer`. A project's own `<MDC>` or `MDCRenderer` now resolves them too.

### `useReportDownload`

Not moved: it already sits in `app/composables/` beside `useConformanceResult` and `useWcagData`, the other two composables of the render set, and needs nothing from the full layer (`useI18n`, `$fetch`, the `report.downloadStatus.*` keys). Step 3 moves all three.

### Rendering unchanged

The playground's three reports were built on `main` (v0.6.8) and on this step and served side by side. Server-rendered HTML and, after opening all 159 issues of `test-audit`, the client DOM of the executive summary, issues and tips (352 images, 143 code blocks with Shiki classes, a table) are identical, apart from one attribute: the executive summary's wrapper `div` now has an empty `class=""`. `MDCRenderer` always passes `class: ctx.class` to its root and Vue's SSR prints `class=""` for an undefined class; `ContentRenderer` hid it by forwarding a fallthrough attribute (`data-content-id`), which makes Vue merge the props and drop the undefined class. No visual or semantic difference. The dev server logs no hydration mismatch or unresolved component.

### For later steps

- Step 3 moves `ReportMarkdown.vue` and `app/components/prose/` with the other report components, and the `components` entries with them into the report layer's `nuxt.config.ts`. That layer should set `ui: { prose: true }` (Nuxt UI then registers its prose components and the `#build/ui/prose/pre` template `ProsePre` imports; today Nuxt Content triggers both), and list `@nuxtjs/mdc` and `minimark` as dependencies.
- Without `@nuxtjs/mdc` there is no `runtimeConfig.public.mdc`: Nuxt UI's `ProseH2`–`ProseH4` then render no anchor links (`mdc.headings.anchorLinks`), and MDC block components (`::callout`) have no map. Report bodies in the playground and in WCAGify-reporter use neither MDC components nor bindings (checked in both content databases), so the portal renders them the same. Step 4's fixture can assert that `MDCRenderer.vue`, imported from `node_modules` without the module, builds there.
- Follow-up, not caused by this step: the share page's password field loses what was typed before hydration (the `v-model` resets it to empty, and `required` then blocks the submit). The share e2e test above types right after the field appears, so it races hydration and only passes while hydration wins. Waiting for hydration in the test (for example until `#__nuxt` has `__vue_app__`) would make it deterministic; keeping typed input across hydration would fix it for slow connections.
- `useRuntimeConfig().public.mdc` is untyped without the module; the playground typecheck passes because Nuxt Content installs it. Step 3's typecheck of the report layer on its own will show whether it needs a cast.
