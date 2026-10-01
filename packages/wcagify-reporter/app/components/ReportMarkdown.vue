<script setup lang="ts">
import type { Component } from 'vue'
import type { Minimark } from '@focusring/wcagify-reporter'
import { toHast } from 'minimark/hast'
import MDCRenderer from '@nuxtjs/mdc/runtime/components/MDCRenderer.vue'

/*
 * Renders a report or issue body (Nuxt Content's minimark tree) the way Nuxt
 * Content's `ContentRenderer` does, without Nuxt Content: the tree becomes HAST
 * and `MDCRenderer` renders it with the `Prose*` components. Imported directly,
 * so the `@nuxtjs/mdc` module and its `/api/_mdc/highlight` route are not
 * needed; code blocks are highlighted when the content is built.
 *
 * The prose map is the one `ContentRenderer` uses, minus `h5` and `h6`, which
 * have no Nuxt UI component (where `@nuxtjs/mdc` is installed, as under Nuxt
 * Content, `MDCRenderer` still maps them to its own). Each name is resolved
 * when the app is built, to the component that won the name: a project's own
 * `ProseImg` before the layer's, the layer's before Nuxt UI's. The `Lazy`
 * prefix loads them on first use, as global components are, so a page that
 * shows no report yet (the share password prompt) does not wait for them. As in
 * `ContentRenderer`, a component map from `@nuxtjs/mdc`'s runtime config (Nuxt
 * Content's `renderer.alias`) and the `components` prop take precedence.
 */
const props = defineProps<{
  body: Minimark
  components?: Record<string, Component>
}>()

const prose: Record<string, Component | string> = {
  p: resolveComponent('LazyProseP'),
  a: resolveComponent('LazyProseA'),
  blockquote: resolveComponent('LazyProseBlockquote'),
  code: resolveComponent('LazyProseCode'),
  pre: resolveComponent('LazyProsePre'),
  em: resolveComponent('LazyProseEm'),
  h1: resolveComponent('LazyProseH1'),
  h2: resolveComponent('LazyProseH2'),
  h3: resolveComponent('LazyProseH3'),
  h4: resolveComponent('LazyProseH4'),
  hr: resolveComponent('LazyProseHr'),
  img: resolveComponent('LazyProseImg'),
  ul: resolveComponent('LazyProseUl'),
  ol: resolveComponent('LazyProseOl'),
  li: resolveComponent('LazyProseLi'),
  strong: resolveComponent('LazyProseStrong'),
  table: resolveComponent('LazyProseTable'),
  thead: resolveComponent('LazyProseThead'),
  tbody: resolveComponent('LazyProseTbody'),
  td: resolveComponent('LazyProseTd'),
  th: resolveComponent('LazyProseTh'),
  tr: resolveComponent('LazyProseTr'),
  script: resolveComponent('LazyProseScript')
}

type MDCRendererProps = InstanceType<typeof MDCRenderer>['$props']

/*
 * `@nuxtjs/mdc`'s public runtime config. It exists only where that module is
 * installed, so an app that extends just this layer has it untyped.
 */
interface MdcPublicConfig {
  components?: { map?: Record<string, string> }
}

const hast = computed(
  () => toHast({ type: 'minimark', value: props.body.value }) as MDCRendererProps['body']
)
const mdc = useRuntimeConfig().public.mdc as MdcPublicConfig | undefined
const tags = computed(
  () =>
    ({ ...prose, ...mdc?.components?.map, ...props.components }) as MDCRendererProps['components']
)
</script>

<template>
  <MDCRenderer v-if="hast.children.length" :body="hast" :components="tags" />
</template>
