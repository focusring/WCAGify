# @focusring/wcagify-reporter

WCAGify's report schemas and scoring, and a render-only Nuxt layer that shows a WCAG report. For apps that display reports without the WCAGify editor: no pages, no server routes, no Nuxt Content. [`@focusring/wcagify`](../wcagify) builds on it and is released with the same version.

## Installation

```bash
pnpm add @focusring/wcagify-reporter
```

## Schemas and scoring

The root entry has no framework dependencies, only `zod`:

```ts
import {
  reportDocumentSchema,
  issueDocumentSchema,
  reportTeaser
} from '@focusring/wcagify-reporter'

const report = reportDocumentSchema.parse(input.report)
const issues = issueDocumentSchema.array().parse(input.issues)
const teaser = reportTeaser(report, issues)
```

## Rendering a report

Extend the layer:

```ts
export default defineNuxtConfig({
  extends: ['@focusring/wcagify-reporter/layer'],
  css: ['~/assets/css/main.css', '@focusring/wcagify-reporter/print.css']
})
```

Import the report styles after Tailwind and Nuxt UI in `app/assets/css/main.css`:

```css
@import 'tailwindcss';
@import '@nuxt/ui';
@import '@focusring/wcagify-reporter/report.css';
```

Render a report from plain data, for example loaded from your own database:

```vue
<script setup lang="ts">
import type { IssueDocument, ReportDocument } from '@focusring/wcagify-reporter'

const { report, issues } = defineProps<{ report: ReportDocument; issues: IssueDocument[] }>()
</script>

<template>
  <ReportContent :report :issues />
</template>
```

## License

[MIT](../../LICENSE)
