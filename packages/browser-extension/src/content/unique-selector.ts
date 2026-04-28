/**
 * Unique CSS selector generator aligned with axe-core's approach.
 * Uses statistical feature analysis (rarest classes/attributes first)
 * rather than purely structural selectors.
 *
 * @see https://github.com/dequelabs/axe-core/blob/develop/lib/core/utils/get-selector.js
 */

const IGNORED_ATTRIBUTES = new Set([
  'class',
  'style',
  'id',
  'selected',
  'checked',
  'disabled',
  'tabindex',
  'aria-checked',
  'aria-selected',
  'aria-invalid',
  'aria-activedescendant',
  'aria-busy',
  'aria-disabled',
  'aria-expanded',
  'aria-grabbed',
  'aria-pressed',
  'aria-valuenow',
  'xmlns'
])

const MAX_ATTRIBUTE_LENGTH = 31
const SIMILAR_FILTER_LIMIT = 700

interface Feature {
  name: string
  count: number
  species: 'class' | 'attribute'
}

interface SelectorData {
  classes: Record<string, number>
  tags: Record<string, number>
  attributes: Record<string, number>
}

function escapeAttribute(str: string): string {
  return str.replace(/([\\"])/g, String.raw`\$1`).replace(/(\r\n|\r|\n)/g, String.raw`\a `)
}

function filterAttribute(attr: Attr): boolean {
  return (
    !IGNORED_ATTRIBUTES.has(attr.name) &&
    !attr.name.includes(':') &&
    (!attr.value || attr.value.length < MAX_ATTRIBUTE_LENGTH)
  )
}

function getAttributeNameValue(node: Element, attr: Attr): string | null {
  const { name } = attr

  if (name.includes('href') || name.includes('src')) {
    const value = node.getAttribute(name) ?? ''
    const friendly = getFriendlyUriEnd(value)
    if (friendly) {
      return `${CSS.escape(name)}$="${escapeAttribute(friendly)}"`
    }
    return `${CSS.escape(name)}="${escapeAttribute(value)}"`
  }

  return `${CSS.escape(name)}="${escapeAttribute(attr.value)}"`
}

/**
 * Extract the last meaningful segment of a URI for use in selectors.
 * Returns the filename or last path segment, trimming query strings and fragments.
 */
function getFriendlyUriEnd(uri: string): string | undefined {
  if (!uri) return

  const index = uri.indexOf('?')
  const noQuery = index !== -1 ? uri.substring(0, index) : uri
  const path = noQuery.split('/').pop() ?? ''

  if (!path || path.length > MAX_ATTRIBUTE_LENGTH) return
  return path
}

function countSort(a: Feature, b: Feature): number {
  if (a.count < b.count) return -1
  if (a.count > b.count) return 1
  return 0
}

/**
 * Walk the DOM tree and gather frequency statistics for tags, classes, and attributes.
 * This enables selecting the rarest features for building selectors.
 */
function getSelectorData(root: Element): SelectorData {
  const data: SelectorData = { classes: {}, tags: {}, attributes: {} }

  const stack: Element[] = [root]
  while (stack.length) {
    const node = stack.pop()!

    const tag = node.nodeName
    data.tags[tag] = (data.tags[tag] ?? 0) + 1

    if (node.classList) {
      for (const cl of node.classList) {
        const escaped = CSS.escape(cl)
        data.classes[escaped] = (data.classes[escaped] ?? 0) + 1
      }
    }

    if (node.hasAttributes()) {
      for (const attr of node.attributes) {
        if (!filterAttribute(attr)) continue
        const atnv = getAttributeNameValue(node, attr)
        if (atnv) {
          data.attributes[atnv] = (data.attributes[atnv] ?? 0) + 1
        }
      }
    }

    for (const child of node.children) {
      stack.push(child)
    }
  }

  return data
}

function uncommonClasses(node: Element, selectorData: SelectorData): Feature[] {
  const result: Feature[] = []
  const tagCount = selectorData.tags[node.nodeName] ?? 0

  if (node.classList) {
    for (const cl of node.classList) {
      const escaped = CSS.escape(cl)
      const count = selectorData.classes[escaped] ?? 0
      if (count < tagCount) {
        result.push({ name: escaped, count, species: 'class' })
      }
    }
  }

  return result.toSorted(countSort)
}

function uncommonAttributes(node: Element, selectorData: SelectorData): Feature[] {
  const result: Feature[] = []
  const tagCount = selectorData.tags[node.nodeName] ?? 0

  if (node.hasAttributes()) {
    for (const attr of node.attributes) {
      if (!filterAttribute(attr)) continue
      const atnv = getAttributeNameValue(node, attr)
      if (atnv) {
        const count = selectorData.attributes[atnv] ?? 0
        if (count < tagCount) {
          result.push({ name: atnv, count, species: 'attribute' })
        }
      }
    }
  }

  return result.toSorted(countSort)
}

function getBaseSelector(elm: Element): string {
  return CSS.escape(elm.nodeName.toLowerCase())
}

function getElmId(elm: Element): string | undefined {
  const id = elm.getAttribute('id')
  if (!id) return undefined

  const escaped = `#${CSS.escape(id)}`
  const doc = elm.getRootNode() as Document | ShadowRoot
  if (doc.querySelectorAll(escaped).length === 1) {
    return escaped
  }

  return undefined
}

function getNthChildString(elm: Element, selector: string): string {
  const siblings = elm.parentNode ? [...elm.parentNode.children] : []

  const hasMatchingSibling = siblings.some(
    (sibling) => sibling !== elm && sibling.matches(selector)
  )

  if (hasMatchingSibling) {
    return `:nth-child(${1 + siblings.indexOf(elm)})`
  }
  return ''
}

/**
 * Pick up to three of the rarest features (classes + attributes) for an element.
 * Follows axe-core's strategy: unique class > unique attribute > three least common.
 */
function getThreeLeastCommonFeatures(elm: Element, selectorData: SelectorData): string {
  const clss = uncommonClasses(elm, selectorData)
  const atts = uncommonAttributes(elm, selectorData)

  let selector = ''
  let features: Feature[] = []

  if (clss.length && clss[0]!.count === 1) {
    features = [clss[0]!]
  } else if (atts.length && atts[0]!.count === 1) {
    features = [atts[0]!]
    selector = getBaseSelector(elm)
  } else {
    features = [...clss, ...atts].toSorted(countSort).slice(0, 3)

    if (features.some((f) => f.species === 'class')) {
      // Classes before attributes
      features.sort((a, b) => {
        if (a.species === b.species) return 0
        return a.species === 'class' ? -1 : 1
      })
    } else {
      selector = getBaseSelector(elm)
    }
  }

  return (selector += features.reduce((val, feat) => {
    if (feat.species === 'class') return `${val}.${feat.name}`
    if (feat.species === 'attribute') return `${val}[${feat.name}]`
    return val
  }, ''))
}

/**
 * Generate a unique CSS selector for an element within a given root.
 * Walks up the ancestor chain, prepending parent selectors until the
 * result uniquely identifies the element.
 */
function generateSelector(
  elm: Element,
  doc: Document | ShadowRoot,
  selectorData: SelectorData
): string {
  let selector = ''
  let similar: Element[] | undefined = undefined
  let current: Element | null = elm

  do {
    let features = getElmId(current)
    if (!features) {
      features = getThreeLeastCommonFeatures(current, selectorData)
      features += getNthChildString(current, features)
    }

    selector = selector ? `${features} > ${selector}` : features

    similar =
      !similar || similar.length > SIMILAR_FILTER_LIMIT
        ? [...doc.querySelectorAll(selector)]
        : similar.filter((item) => item.matches(selector))

    current = current.parentElement
  } while (similar.length > 1 && current && current.nodeType !== 11)

  if (similar.length === 1) {
    return selector
  }

  if (selector.includes(' > ')) {
    return `:root${selector.substring(selector.indexOf(' > '))}`
  }

  return ':root'
}

/**
 * Get a unique CSS selector for an element, handling shadow DOM boundaries.
 * Returns a single string for regular DOM elements, or an array of strings
 * for elements inside shadow DOM (one selector per shadow tree boundary).
 */
function getRootElement(doc: Document | ShadowRoot): Element {
  if (doc.nodeType === 11) {
    return (doc as ShadowRoot).host
  }
  return (doc as Document).documentElement ?? document.documentElement
}

export function getUniqueSelector(el: Element): string | string[] {
  if (!el) return ''

  let doc = el.getRootNode() as Document | ShadowRoot

  // Regular DOM — no shadow boundary
  if (doc.nodeType !== 11) {
    const selectorData = getSelectorData(getRootElement(doc))
    return generateSelector(el, doc, selectorData)
  }

  // Shadow DOM — collect selectors per shadow boundary
  const stack: { elm: Element; doc: Document | ShadowRoot }[] = []
  let current: Element = el

  while (doc.nodeType === 11) {
    const shadowRoot = doc as ShadowRoot
    if (!shadowRoot.host) return ''

    stack.unshift({ elm: current, doc })

    current = shadowRoot.host
    doc = current.getRootNode() as Document | ShadowRoot
  }

  stack.unshift({ elm: current, doc })

  return stack.map((item) => {
    const data = getSelectorData(getRootElement(item.doc))
    return generateSelector(item.elm, item.doc, data)
  })
}
