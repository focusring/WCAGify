<script setup lang="ts">
import { ref } from 'vue'

const isSaas = ref(false)
</script>

<template>
  <div class="mx-auto max-w-6xl px-6">
    <!-- Hero -->
    <section class="flex min-h-[calc(100vh-64px)] items-center py-16">
      <div class="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 class="mb-4 font-bold tracking-widest text-[var(--vp-c-brand-1)]">
            WCAGify
            <br />
            <span
              class="text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.1] tracking-tight text-(--vp-c-text-1)"
            >
              Accessibility audit reports made simple.
            </span>
          </h1>

          <div class="mt-4 flex items-center gap-3">
            <span
              class="text-lg font-semibold"
              :class="!isSaas ? 'text-(--vp-c-brand-1)' : 'text-(--vp-c-text-2)'"
            >
              Self-hosted
            </span>
            <button
              role="switch"
              :aria-checked="isSaas"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--vp-c-brand-1) focus-visible:ring-offset-2"
              :class="isSaas ? 'bg-(--vp-c-brand-1)' : 'bg-(--vp-c-border)'"
              @click="isSaas = !isSaas"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200"
                :class="isSaas ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
            <span
              class="text-lg font-semibold"
              :class="isSaas ? 'text-(--vp-c-brand-1)' : 'text-(--vp-c-text-2)'"
            >
              SaaS <small class="align-super text-xs text-(--vp-c-text-2)">(Soon)</small>
            </span>
          </div>
          <ul
            class="mt-2 list-none space-y-1 p-0 text-lg leading-relaxed text-(--vp-c-text-2)"
          >
            <template v-if="!isSaas">
              <li class="font-semibold text-(--vp-c-brand-1)">Free forever.</li>
              <li class="font-semibold text-(--vp-c-brand-1)">Open source.</li>
              <li class="font-semibold text-(--vp-c-brand-1)">No data collection.</li>
              <li class="font-semibold text-(--vp-c-brand-1)">No sign up.</li>
            </template>
            <template v-else>
              <li class="font-semibold text-(--vp-c-brand-1)">No setup required.</li>
              <li class="font-semibold text-(--vp-c-brand-1)">Zero maintenance.</li>
              <li class="font-semibold text-(--vp-c-brand-1)">Always up to date.</li>
              <li class="font-semibold text-(--vp-c-brand-1)">No technical skills needed.</li>
            </template>
          </ul>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/guide/getting-started"
              class="inline-flex items-center justify-center rounded-lg bg-[var(--vp-c-brand-1)] px-6 py-3 text-[0.9375rem] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-90"
            >
              Get Started
            </a>
            <a
              href="https://demo.wcagify.com/"
              class="inline-flex items-center justify-center rounded-lg border border-[var(--vp-c-border)] bg-transparent px-6 py-3 text-[0.9375rem] font-semibold text-[var(--vp-c-text-1)] no-underline transition hover:-translate-y-px hover:border-[var(--vp-c-brand-1)] hover:text-[var(--vp-c-brand-1)]"
              target="_blank"
              rel="noopener"
            >
              Live Demo
            </a>
            <a
              href="https://github.com/focusring/wcagify"
              class="inline-flex items-center justify-center rounded-lg border border-[var(--vp-c-border)] bg-transparent px-6 py-3 text-[0.9375rem] font-semibold text-[var(--vp-c-text-1)] no-underline transition hover:-translate-y-px hover:border-[var(--vp-c-brand-1)] hover:text-[var(--vp-c-brand-1)]"
              target="_blank"
              rel="noopener"
            >
              GitHub
            </a>
          </div>
        </div>

        <div class="flex items-center">
          <div
            class="w-full overflow-hidden rounded-xl border border-[var(--vp-c-border)] bg-[var(--vp-c-bg-soft)]"
          >
            <div
              class="border-b border-[var(--vp-c-border)] px-5 py-2.5 text-[0.8125rem] font-semibold tracking-wider uppercase text-[var(--vp-c-brand-1)]"
            >
              Quick start
            </div>
            <pre
              class="m-0 overflow-x-auto p-5"
            ><code class="font-mono text-sm leading-relaxed text-[var(--vp-c-text-1)]"><span class="select-none text-[var(--vp-c-text-3)]">$</span> pnpm create wcagify my-audit
<span class="select-none text-[var(--vp-c-text-3)]">$</span> cd my-audit
<span class="select-none text-[var(--vp-c-text-3)]">$</span> pnpm dev</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          class="rounded-xl border border-[var(--vp-c-border)] bg-[var(--vp-c-bg-soft)] p-7 transition-colors hover:border-[var(--vp-c-brand-1)]"
        >
          <h3 class="mb-2 text-base font-bold text-[var(--vp-c-text-1)]">
            Markdown-driven
          </h3>
          <p class="m-0 text-sm leading-relaxed text-[var(--vp-c-text-2)]">
            Write audit findings in markdown. WCAGify turns them into
            structured, navigable reports.
          </p>
        </div>
        <div
          class="rounded-xl border border-[var(--vp-c-border)] bg-[var(--vp-c-bg-soft)] p-7 transition-colors hover:border-[var(--vp-c-brand-1)]"
        >
          <h3 class="mb-2 text-base font-bold text-[var(--vp-c-text-1)]">
            WCAG 2.2 aligned
          </h3>
          <p class="m-0 text-sm leading-relaxed text-[var(--vp-c-text-2)]">
            Issues reference success criteria directly, keeping your reports
            standards-compliant.
          </p>
        </div>
        <div
          class="rounded-xl border border-[var(--vp-c-border)] bg-[var(--vp-c-bg-soft)] p-7 transition-colors hover:border-[var(--vp-c-brand-1)]"
        >
          <h3 class="mb-2 text-base font-bold text-[var(--vp-c-text-1)]">
            Multi-language
          </h3>
          <p class="m-0 text-sm leading-relaxed text-[var(--vp-c-text-2)]">
            Built-in support for Dutch and English with easy extensibility for
            additional locales.
          </p>
        </div>
        <div
          class="rounded-xl border border-[var(--vp-c-border)] bg-[var(--vp-c-bg-soft)] p-7 transition-colors hover:border-[var(--vp-c-brand-1)]"
        >
          <h3 class="mb-2 text-base font-bold text-[var(--vp-c-text-1)]">
            PDF export
          </h3>
          <p class="m-0 text-sm leading-relaxed text-[var(--vp-c-text-2)]">
            Export accessible PDFs with cover pages, running headers, and page
            numbers.
          </p>
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="pb-30 pt-20 text-center">
      <p
        class="mb-8 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-snug text-[var(--vp-c-text-1)]"
      >
        Stop wrestling with report templates.<br />
        Start writing findings.
      </p>
      <a
        href="/guide/getting-started"
        class="inline-flex items-center rounded-lg bg-[var(--vp-c-brand-1)] px-6 py-3 text-[0.9375rem] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-90"
      >
        Read the docs
      </a>
    </section>
  </div>
</template>
