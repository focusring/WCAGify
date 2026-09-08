# Configuration

WCAGify is configured through standard Nuxt configuration files.

## Nuxt Config

The main configuration file is `nuxt.config.ts` in the project root.

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/ui', '@nuxtjs/i18n', 'nuxt-studio']
})
```

## Content Collections

Content collections are defined in `content.config.ts`. WCAGify uses three collections:

| Collection | Path                              | Description           |
| ---------- | --------------------------------- | --------------------- |
| `reports`  | `content/reports/{slug}/index.md` | Report metadata       |
| `issues`   | `content/reports/{slug}/*.md`     | Individual findings   |
| `shared`   | `content/shared/{lang}/*.md`      | Shared content blocks |

## Internationalization

Language settings are configured through `@nuxtjs/i18n`:

| Setting   | Value          |
| --------- | -------------- |
| Default   | `en` (English) |
| Secondary | `nl` (Dutch)   |
| Strategy  | `no_prefix`    |

Translation files live in the core layer at `packages/wcagify/locales/`:

```
packages/wcagify/locales/
├── en.ts
└── nl.ts
```

## Linting and Formatting

| Tool   | Command     | Config file        |
| ------ | ----------- | ------------------ |
| OXlint | `pnpm lint` | `oxlint.config.ts` |
| oxfmt  | `pnpm fmt`  | —                  |

## Commands Reference

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Start development server      |
| `pnpm build`      | Production build              |
| `pnpm preview`    | Preview production build      |
| `pnpm lint`       | Run OXlint                    |
| `pnpm typecheck`  | Run type checking             |
| `pnpm docs:dev`   | Start docs development server |
| `pnpm docs:build` | Build documentation site      |
