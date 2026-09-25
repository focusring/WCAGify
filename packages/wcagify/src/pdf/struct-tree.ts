import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, PDFString } from 'pdf-lib'
import type { PDFContext, PDFObject } from 'pdf-lib'

type StringObject = PDFString | PDFHexString
type HeaderScope = 'Column' | 'Row'

interface IdEntry {
  id: StringObject
  ref: PDFRef
}

interface TableRow {
  row: PDFDict
  inHead: boolean
}

interface RowCollection {
  ctx: PDFContext
  rows: TableRow[]
}

interface Walk {
  ctx: PDFContext
  ids: Map<string, IdEntry>
  seen: Set<PDFDict>
}

const n = PDFName.of

/** The raw entries of a /K value: a single object (possibly a ref) or the items of an array. */
function kidsOf(ctx: PDFContext, kids: PDFObject | undefined): PDFObject[] {
  if (kids === undefined) return []
  const resolved = ctx.lookup(kids)
  return resolved instanceof PDFArray ? resolved.asArray() : [kids]
}

/** Resolves a /K entry to a structure element dict; marked content refs and MCIDs yield undefined. */
function structElem(ctx: PDFContext, node: PDFObject): PDFDict | undefined {
  const resolved = ctx.lookup(node)
  if (!(resolved instanceof PDFDict)) return undefined
  return resolved.get(n('S')) instanceof PDFName ? resolved : undefined
}

function visitKids(walk: Walk, kids: PDFObject | undefined): void {
  for (const kid of kidsOf(walk.ctx, kids)) visitElem(walk, kid)
}

function visitElem(walk: Walk, node: PDFObject): void {
  const elem = structElem(walk.ctx, node)
  if (!elem || walk.seen.has(elem)) return
  walk.seen.add(elem)

  const id = elem.get(n('ID'))
  if (node instanceof PDFRef && (id instanceof PDFString || id instanceof PDFHexString)) {
    const key = bytesKey(id.asBytes())
    if (!walk.ids.has(key)) walk.ids.set(key, { id, ref: node })
  }

  if (elem.get(n('S')) === n('Table')) scopeTableHeaders(walk.ctx, elem)
  visitKids(walk, elem.get(n('K')))
}

function scopeTableHeaders(ctx: PDFContext, table: PDFDict): void {
  const rows: TableRow[] = []
  collectRows({ ctx, rows }, table.get(n('K')), false)
  const hasHead = rows.some((entry) => entry.inHead)

  rows.forEach(({ row, inHead }, index) => {
    const isHeaderRow = hasHead ? inHead : index === 0
    const scope: HeaderScope = isHeaderRow ? 'Column' : 'Row'
    for (const kid of kidsOf(ctx, row.get(n('K')))) {
      const cell = structElem(ctx, kid)
      if (cell?.get(n('S')) === n('TH')) setScope(ctx, cell, scope)
    }
  })
}

/** Collects the /TR elements of a table in document order, looking through /THead, /TBody, /TFoot and other wrappers. */
function collectRows(
  collection: RowCollection,
  kids: PDFObject | undefined,
  inHead: boolean
): void {
  for (const kid of kidsOf(collection.ctx, kids)) {
    const elem = structElem(collection.ctx, kid)
    if (!elem) continue
    const type = elem.get(n('S'))
    if (type === n('TR')) collection.rows.push({ row: elem, inHead })
    else if (type !== n('Table')) {
      collectRows(collection, elem.get(n('K')), inHead || type === n('THead'))
    }
  }
}

function setScope(ctx: PDFContext, th: PDFDict, scope: HeaderScope): void {
  const attrs = th.get(n('A'))
  const resolved = attrs === undefined ? undefined : ctx.lookup(attrs)

  const tableAttrs = findTableAttrs(ctx, resolved)
  if (tableAttrs) {
    if (!tableAttrs.has(n('Scope'))) tableAttrs.set(n('Scope'), n(scope))
    return
  }

  const fresh = ctx.obj({ O: 'Table', Scope: scope })
  if (attrs === undefined) th.set(n('A'), fresh)
  else if (resolved instanceof PDFArray) resolved.push(fresh)
  else th.set(n('A'), ctx.obj([attrs, fresh]))
}

/** Finds the attribute dict owned by /Table among a /A value (a dict, or an array of dicts and revision numbers). */
function findTableAttrs(ctx: PDFContext, attrs: PDFObject | undefined): PDFDict | undefined {
  if (attrs === undefined) return undefined
  const candidates = attrs instanceof PDFArray ? attrs.asArray() : [attrs]
  for (const candidate of candidates) {
    const dict = ctx.lookup(candidate)
    if (dict instanceof PDFDict && dict.get(n('O')) === n('Table')) return dict
  }
  return undefined
}

/** A single-node name tree; keys must be sorted byte strings (ISO 32000-1 §7.9.6). */
function buildIdTree(ctx: PDFContext, ids: Map<string, IdEntry>): PDFRef {
  const sorted = [...ids.values()].toSorted((a, b) => compareBytes(a.id.asBytes(), b.id.asBytes()))
  const names: PDFObject[] = []
  for (const { id, ref } of sorted) names.push(id, ref)
  return ctx.register(ctx.obj({ Names: names }))
}

function bytesKey(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const length = Math.min(a.length, b.length)
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) return a[i]! - b[i]!
  }
  return a.length - b.length
}

/**
 * WeasyPrint tags table header cells as /TH with an /ID and points every
 * data cell at them through /Headers, but writes neither a /Scope attribute
 * nor the /IDTree that makes those ID references resolvable (ISO 32000-1
 * §14.7.4.2 and §14.8.4.7). Assistive technology therefore cannot tie a
 * data cell to its column and row headers (WCAG 1.3.1, technique PDF6).
 *
 * This walks the structure tree and adds both: a /Scope on every /TH derived
 * from its position (headers in /THead, or in the first row when the table
 * has no /THead, are column headers; all others are row headers — matching
 * the `scope="col"` / `scope="row"` attributes of the source HTML) and an
 * /IDTree on the /StructTreeRoot mapping each element /ID to its element.
 * Existing attributes, /ParentTree, /MarkInfo and metadata are left as they are.
 */
export async function fixTableHeaders(pdf: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false })
  const root = doc.catalog.lookupMaybe(n('StructTreeRoot'), PDFDict)
  if (!root) return pdf

  const walk: Walk = { ctx: doc.context, ids: new Map(), seen: new Set() }
  visitKids(walk, root.get(n('K')))

  if (!root.has(n('IDTree')) && walk.ids.size > 0) {
    root.set(n('IDTree'), buildIdTree(doc.context, walk.ids))
  }

  return doc.save()
}
