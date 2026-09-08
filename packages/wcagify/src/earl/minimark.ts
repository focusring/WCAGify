/**
 * Nuxt Content stores markdown bodies as a "minimark" tree: every element is
 * `[tag, props, ...children]` and text is a plain string. This converts such
 * a tree back to readable markdown-flavoured plain text for use in EARL
 * result descriptions.
 */

type MinimarkNode = string | MinimarkElement
type MinimarkElement = [string, Record<string, unknown>, ...MinimarkNode[]]

interface MinimarkBody {
  type?: string
  value: MinimarkNode[]
}

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'blockquote',
  'pre',
  'ul',
  'ol',
  'table',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6'
])

function isElement(node: MinimarkNode): node is MinimarkElement {
  return Array.isArray(node) && typeof node[0] === 'string'
}

function renderChildren(children: MinimarkNode[], listDepth: number): string {
  return children.map((child) => renderNode(child, listDepth)).join('')
}

function renderList(element: MinimarkElement, listDepth: number): string {
  const [tag] = element
  const children = element.slice(2) as MinimarkNode[]
  const ordered = tag === 'ol'
  const indent = '  '.repeat(listDepth)
  let index = 0
  const items = children
    .filter(isElement)
    .filter((child) => child[0] === 'li')
    .map((item) => {
      index++
      const itemChildren = item.slice(2) as MinimarkNode[]
      const marker = ordered ? `${index}.` : '-'
      const content = renderChildren(itemChildren, listDepth + 1)
        .trim()
        .replace(/\n{2,}/g, '\n')
      return `${indent}${marker} ${content}`
    })
  // A nested list starts on its own line below the item that contains it.
  const prefix = listDepth > 0 ? '\n' : ''
  return `${prefix}${items.join('\n')}\n\n`
}

function renderTable(element: MinimarkElement, listDepth: number): string {
  const children = element.slice(2) as MinimarkNode[]
  const rows: string[] = []
  const walk = (nodes: MinimarkNode[]) => {
    for (const node of nodes) {
      if (!isElement(node)) continue
      const [tag] = node
      const inner = node.slice(2) as MinimarkNode[]
      if (tag === 'tr') {
        const cells = inner
          .filter(isElement)
          .map((cell) => renderChildren(cell.slice(2) as MinimarkNode[], listDepth).trim())
        rows.push(`| ${cells.join(' | ')} |`)
      } else {
        walk(inner)
      }
    }
  }
  walk(children)
  return `${rows.join('\n')}\n\n`
}

function renderNode(node: MinimarkNode, listDepth: number): string {
  if (typeof node === 'string') return node
  if (!isElement(node)) return ''

  const [tag, props = {}, ...children] = node
  const inner = () => renderChildren(children, listDepth)

  switch (tag) {
    case 'br': {
      return '\n'
    }
    case 'hr': {
      return '---\n\n'
    }
    case 'img': {
      const alt = typeof props.alt === 'string' ? props.alt : ''
      const src = typeof props.src === 'string' ? props.src : ''
      return alt || src ? `[${alt || 'image'}](${src})` : ''
    }
    case 'code': {
      return `\`${inner()}\``
    }
    case 'pre': {
      return `\`\`\`\n${inner().replace(/`/g, '')}\n\`\`\`\n\n`
    }
    case 'strong':
    case 'b': {
      return `**${inner()}**`
    }
    case 'em':
    case 'i': {
      return `_${inner()}_`
    }
    case 'a': {
      const href = typeof props.href === 'string' ? props.href : ''
      const text = inner()
      return href && href !== text ? `${text} (${href})` : text
    }
    case 'ul':
    case 'ol': {
      return renderList(node, listDepth)
    }
    case 'table': {
      return renderTable(node, listDepth)
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      return `${'#'.repeat(Number(tag.charAt(1)))} ${inner().trim()}\n\n`
    }
    case 'blockquote': {
      return `${inner()
        .trim()
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')}\n\n`
    }
    default: {
      return BLOCK_TAGS.has(tag) ? `${inner().trim()}\n\n` : inner()
    }
  }
}

/**
 * Converts a Nuxt Content body (minimark tree) or an already textual body to
 * plain text. Returns an empty string for missing bodies.
 */
function minimarkToText(body: MinimarkBody | string | null | undefined): string {
  if (!body) return ''
  if (typeof body === 'string') return body.trim()
  if (!Array.isArray(body.value)) return ''
  return renderChildren(body.value, 0)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export { minimarkToText }
export type { MinimarkBody, MinimarkNode, MinimarkElement }
