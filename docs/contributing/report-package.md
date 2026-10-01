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
