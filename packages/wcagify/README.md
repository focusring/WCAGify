<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../../docs/public/wcagify-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="../../docs/public/wcagify-light.svg" />
    <img src="../../docs/public/wcagify.svg" alt="WCAGify logo" width="120" height="120" />
  </picture>
</p>

# @focusring/wcagify

WCAG accessibility audit tool — Nuxt layer with report generation and PDF export.

## Installation

```bash
pnpm add @focusring/wcagify
```

## Usage

Extend your Nuxt app with the WCAGify layer:

```ts
export default defineNuxtConfig({
  extends: ['@focusring/wcagify/layer']
})
```

## License

[MIT](../../LICENSE)
