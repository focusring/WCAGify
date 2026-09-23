# 05: Extension scaffold with recording counter

**What to build:** A new workspace package for WCAGify Capture on the issue extension's conventions: Manifest V3, Vite with the crxjs plugin, Vue 3, Nuxt UI through its Vite plugin, the custom i18n composable in Dutch and English, storage-backed composables and a side panel. The panel offers Start capture and Stop capture for the active tab. Start attaches the debugger to that tab and enables network events; the panel shows a live count of requests and responses recorded; Stop detaches. Dev and build scripts, the knip block, the root test filter, lint and format all pass.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The package builds and loads unpacked in Chromium; the toolbar icon opens the side panel
- [ ] Start attaches to the active tab, refuses browser-internal and extension pages with a message, and the counter climbs while browsing the playground; Stop detaches and the debugger bar disappears
- [ ] The panel is in Dutch and English using the same locale storage as the issue extension
- [ ] Lint, format, knip and typecheck pass; a unit test covers the counter logic with a stubbed browser global
- [ ] The package README explains load-unpacked installation
