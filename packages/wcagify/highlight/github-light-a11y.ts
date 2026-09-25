/**
 * `github-light-a11y`: Shiki's `github-light` theme with four colours darkened just
 * enough to reach 4.5:1 (WCAG 1.4.3) on the code backgrounds the app uses — the
 * light `bg-muted` (slate-50, #f8fafc) on the web and #f3f4f6 in the PDF export —
 * while keeping GitHub's recognisable hues:
 *
 * - tags          #22863a -> #1a7f37 (green;  was 4.42:1 / 4.20:1)
 * - keywords      #d73a49 -> #cf222e (red;    was 4.37:1 / 4.16:1)
 * - variables     #e36209 -> #ab5000 (orange; was 3.34:1 / 3.17:1)
 * - comments      #6a737d -> #656d76 (grey;   was 4.60:1 / 4.38:1)
 *
 * Everything else (text #24292e, purple entities/attribute names #6f42c1, blue
 * constants #005cc5, navy strings #032f62) already passes and is copied verbatim.
 *
 * The object is passed straight to Nuxt Content / @nuxtjs/mdc, which accept a
 * shiki `ThemeRegistrationRaw` wherever a theme name is allowed. It is a plain
 * serialisable object on purpose: the layer's nuxt.config is serialised, and
 * `shiki` itself is not a dependency of this package.
 */

interface TokenColor {
  scope: string | string[]
  settings: {
    foreground?: string
    background?: string
    fontStyle?: string
    content?: string
  }
}

export interface HighlightTheme {
  name: string
  type: 'light' | 'dark'
  fg: string
  bg: string
  colors: Record<string, string>
  tokenColors: TokenColor[]
}

export const githubLightA11y: HighlightTheme = {
  name: 'github-light-a11y',
  type: 'light',
  fg: '#24292e',
  bg: '#ffffff',
  colors: {
    'editor.foreground': '#24292e',
    'editor.background': '#ffffff'
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: '#656d76' }
    },
    {
      scope: [
        'constant',
        'entity.name.constant',
        'variable.other.constant',
        'variable.other.enummember',
        'variable.language'
      ],
      settings: { foreground: '#005cc5' }
    },
    {
      scope: ['entity', 'entity.name'],
      settings: { foreground: '#6f42c1' }
    },
    {
      scope: 'variable.parameter.function',
      settings: { foreground: '#24292e' }
    },
    {
      scope: 'entity.name.tag',
      settings: { foreground: '#1a7f37' }
    },
    {
      scope: 'keyword',
      settings: { foreground: '#cf222e' }
    },
    {
      scope: ['storage', 'storage.type'],
      settings: { foreground: '#cf222e' }
    },
    {
      scope: ['storage.modifier.package', 'storage.modifier.import', 'storage.type.java'],
      settings: { foreground: '#24292e' }
    },
    {
      scope: [
        'string',
        'punctuation.definition.string',
        'string punctuation.section.embedded source'
      ],
      settings: { foreground: '#032f62' }
    },
    {
      scope: 'support',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: 'meta.property-name',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: 'variable',
      settings: { foreground: '#ab5000' }
    },
    {
      scope: 'variable.other',
      settings: { foreground: '#24292e' }
    },
    {
      scope: 'invalid.broken',
      settings: { fontStyle: 'italic', foreground: '#b31d28' }
    },
    {
      scope: 'invalid.deprecated',
      settings: { fontStyle: 'italic', foreground: '#b31d28' }
    },
    {
      scope: 'invalid.illegal',
      settings: { fontStyle: 'italic', foreground: '#b31d28' }
    },
    {
      scope: 'invalid.unimplemented',
      settings: { fontStyle: 'italic', foreground: '#b31d28' }
    },
    {
      scope: 'carriage-return',
      settings: {
        background: '#d73a49',
        content: '^M',
        fontStyle: 'italic underline',
        foreground: '#fafbfc'
      }
    },
    {
      scope: 'message.error',
      settings: { foreground: '#b31d28' }
    },
    {
      scope: 'string variable',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: ['source.regexp', 'string.regexp'],
      settings: { foreground: '#032f62' }
    },
    {
      scope: [
        'string.regexp.character-class',
        'string.regexp constant.character.escape',
        'string.regexp source.ruby.embedded',
        'string.regexp string.regexp.arbitrary-repitition'
      ],
      settings: { foreground: '#032f62' }
    },
    {
      scope: 'string.regexp constant.character.escape',
      settings: { fontStyle: 'bold', foreground: '#1a7f37' }
    },
    {
      scope: 'support.constant',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: 'support.variable',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: 'meta.module-reference',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: 'punctuation.definition.list.begin.markdown',
      settings: { foreground: '#ab5000' }
    },
    {
      scope: ['markup.heading', 'markup.heading entity.name'],
      settings: { fontStyle: 'bold', foreground: '#005cc5' }
    },
    {
      scope: 'markup.quote',
      settings: { foreground: '#1a7f37' }
    },
    {
      scope: 'markup.italic',
      settings: { fontStyle: 'italic', foreground: '#24292e' }
    },
    {
      scope: 'markup.bold',
      settings: { fontStyle: 'bold', foreground: '#24292e' }
    },
    {
      scope: 'markup.underline',
      settings: { fontStyle: 'underline' }
    },
    {
      scope: 'markup.strikethrough',
      settings: { fontStyle: 'strikethrough' }
    },
    {
      scope: 'markup.inline.raw',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'],
      settings: { background: '#ffeef0', foreground: '#b31d28' }
    },
    {
      scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'],
      settings: { background: '#f0fff4', foreground: '#1a7f37' }
    },
    {
      scope: ['markup.changed', 'punctuation.definition.changed'],
      settings: { background: '#ffebda', foreground: '#ab5000' }
    },
    {
      scope: ['markup.ignored', 'markup.untracked'],
      settings: { background: '#005cc5', foreground: '#f6f8fa' }
    },
    {
      scope: 'meta.diff.range',
      settings: { fontStyle: 'bold', foreground: '#6f42c1' }
    },
    {
      scope: 'meta.diff.header',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: 'meta.separator',
      settings: { fontStyle: 'bold', foreground: '#005cc5' }
    },
    {
      scope: 'meta.output',
      settings: { foreground: '#005cc5' }
    },
    {
      scope: [
        'brackethighlighter.tag',
        'brackethighlighter.curly',
        'brackethighlighter.round',
        'brackethighlighter.square',
        'brackethighlighter.angle',
        'brackethighlighter.quote'
      ],
      settings: { foreground: '#586069' }
    },
    {
      scope: 'brackethighlighter.unmatched',
      settings: { foreground: '#b31d28' }
    },
    {
      scope: ['constant.other.reference.link', 'string.other.link'],
      settings: { fontStyle: 'underline', foreground: '#032f62' }
    }
  ]
}

export default githubLightA11y
