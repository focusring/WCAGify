/**
 * Remark plugin that gives unlabelled code blocks a language so Shiki can highlight them.
 *
 * Audit reports are often written with indented code blocks or plain ``` fences, which
 * carry no language. Shiki then leaves them as one-colour text. This plugin guesses
 * `html`, `css`, `javascript` or `json` from the code itself and leaves everything else
 * untouched. Blocks that already declare a language, including `text`, are never changed.
 */

interface CodeNode {
  type: string
  lang?: string | null
  value?: string
  children?: CodeNode[]
}

const HTML_RE = /^\s*(?:<!--|<!doctype|<[a-z][\w-]*[\s>/])/i
const HTML_CLOSE_RE = /<\/[a-z][\w-]*\s*>/i
const CSS_AT_RULE_RE = /^\s*@(?:media|supports|container|layer|font-face|keyframes|page|import)\b/i
const CSS_BLOCK_RE = /^[\s]*[@.#:[\]*\w-][^{};]*\{[^{}]*:[^{}]*\}/m
const CSS_ONLY_DECLARATIONS_RE = /^\s*[a-z-]+\s*:\s*[^;{}]+;\s*$/im
const JS_COMMENT_RE = /^\s*\/\/\s*\S/
const JS_RE =
  /\b(?:function|const|let|var|return|import|export|await|document|window|addEventListener|querySelector|if\s*\()|=>|\.\w+\(|;\s*$/m

function guessCodeLanguage(code: string): string | undefined {
  const trimmed = code.trim()
  if (!trimmed) return undefined

  if (HTML_RE.test(trimmed) || HTML_CLOSE_RE.test(trimmed)) return 'html'

  if (/^[[{]/.test(trimmed)) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // Not JSON, fall through
    }
  }

  const looksLikeJs = /=>|\bfunction\b|\bconst\b|\blet\b/.test(trimmed)
  if (CSS_AT_RULE_RE.test(trimmed) && !looksLikeJs) return 'css'
  if (CSS_BLOCK_RE.test(trimmed) && !looksLikeJs) return 'css'
  if (CSS_ONLY_DECLARATIONS_RE.test(trimmed) && !/[=()]/.test(trimmed)) return 'css'

  if (JS_COMMENT_RE.test(trimmed)) return 'javascript'
  if (JS_RE.test(trimmed) && /[;{}()=]/.test(trimmed)) return 'javascript'

  return undefined
}

function walk(node: CodeNode, visitor: (node: CodeNode) => void): void {
  visitor(node)
  if (node.children) for (const child of node.children) walk(child, visitor)
}

function remarkCodeLang() {
  return (tree: CodeNode) => {
    walk(tree, (node) => {
      if (node.type !== 'code' || node.lang) return
      const lang = guessCodeLanguage(node.value ?? '')
      if (lang) node.lang = lang
    })
  }
}

export { guessCodeLanguage }
export default remarkCodeLang
