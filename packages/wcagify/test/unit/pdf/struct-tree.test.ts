import { describe, it, expect, beforeAll } from 'vitest'
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef, PDFString } from 'pdf-lib'
import type { PDFContext, PDFObject } from 'pdf-lib'
import { fixTableHeaders } from '../../../src/pdf/struct-tree'

const n = PDFName.of

/**
 * Mirrors WeasyPrint's output for the report tables: /TH elements with an
 * /ID, data cells with /Headers, no /Scope and no /IDTree. IDs are chosen so
 * document order differs from byte order (the IDTree must be sorted).
 */
async function buildTaggedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage()
  const ctx = doc.context

  const elem = (type: string, kids: PDFRef[] = [], extra: Record<string, unknown> = {}) =>
    ctx.register(ctx.obj({ Type: 'StructElem', S: type, K: kids, ...extra }))
  const id = (value: string) => PDFString.of(value)

  // Table 1: THead / TBody like the scorecard. Headers on both axes.
  const colA = elem('TH', [], { ID: id('z-col-a') })
  const colB = elem('TH', [], { ID: id('z-col-b'), A: ctx.obj({ O: 'Layout', Width: 40 }) })
  const row1 = elem('TH', [], { ID: id('z-row-1'), A: ctx.obj({ O: 'Table', ColSpan: 1 }) })
  const row2 = elem('TH', [], { ID: id('z-row-2'), A: ctx.obj({ O: 'Table', Scope: 'Both' }) })
  const cell = (headers: string[]) =>
    elem('TD', [], { Headers: ctx.obj(headers.map((header) => id(header))) })
  const table1 = elem('Table', [
    elem('THead', [elem('TR', [colA, colB])]),
    elem('TBody', [
      elem('TR', [row1, cell(['z-col-a', 'z-row-1'])]),
      elem('TR', [row2, cell(['z-col-a', 'z-row-2'])])
    ])
  ])

  // Table 2: bare rows, no THead. Only the first row holds column headers.
  const table2 = elem('Table', [
    elem('TR', [elem('TH', [], { ID: id('a-1') }), elem('TH', [], { ID: id('a-2') })]),
    elem('TR', [elem('TH', [], { ID: id('a-3') }), cell(['a-1', 'a-3'])])
  ])

  const document = elem('Document', [table1, table2])
  const root = ctx.register(
    ctx.obj({
      Type: 'StructTreeRoot',
      K: [document],
      ParentTree: ctx.obj({ Nums: [] }),
      ParentTreeNextKey: 0
    })
  )
  doc.catalog.set(n('StructTreeRoot'), root)
  doc.catalog.set(n('MarkInfo'), ctx.obj({ Marked: true }))

  return doc.save({ useObjectStreams: false })
}

interface HeaderInfo {
  scope?: string
  attrs: PDFDict[]
}

function attrDicts(ctx: PDFContext, attrs: PDFObject | undefined): PDFDict[] {
  if (attrs === undefined) return []
  const resolved = ctx.lookup(attrs)
  const items = resolved instanceof PDFArray ? resolved.asArray() : [resolved]
  return items.map((item) => ctx.lookup(item)).filter((item) => item instanceof PDFDict)
}

/** Every /TH in the structure tree, keyed by its /ID. */
function collectHeaders(doc: PDFDocument): Map<string, HeaderInfo> {
  const ctx = doc.context
  const headers = new Map<string, HeaderInfo>()
  const visit = (node: PDFObject | undefined): void => {
    if (node === undefined) return
    const resolved = ctx.lookup(node)
    if (resolved instanceof PDFArray) {
      resolved.asArray().forEach(visit)
      return
    }
    if (!(resolved instanceof PDFDict)) return
    if (resolved.get(n('S')) === n('TH')) {
      const attrs = attrDicts(ctx, resolved.get(n('A')))
      const table = attrs.find((dict) => dict.get(n('O')) === n('Table'))
      const scope = table?.get(n('Scope'))
      const idValue = resolved.get(n('ID'))
      headers.set(idValue instanceof PDFString ? idValue.decodeText() : '', {
        scope: scope instanceof PDFName ? scope.decodeText() : undefined,
        attrs
      })
    }
    visit(resolved.get(n('K')))
  }
  const root = doc.catalog.lookup(n('StructTreeRoot'), PDFDict)
  visit(root.get(n('K')))
  return headers
}

describe('fixTableHeaders', () => {
  let input: Uint8Array
  let output: Uint8Array
  let doc: PDFDocument
  let headers: Map<string, HeaderInfo>

  beforeAll(async () => {
    input = await buildTaggedPdf()
    output = await fixTableHeaders(input)
    doc = await PDFDocument.load(output)
    headers = collectHeaders(doc)
  })

  it('starts from a fixture where only one header has a /Scope and no /IDTree exists', async () => {
    const before = await PDFDocument.load(input)
    const scoped = [...collectHeaders(before)].filter(([, info]) => info.scope)
    expect(scoped.map(([id]) => id)).toEqual(['z-row-2'])
    expect(before.catalog.lookup(n('StructTreeRoot'), PDFDict).has(n('IDTree'))).toBe(false)
  })

  it('gives THead cells a Column scope and body cells a Row scope', () => {
    expect(headers.get('z-col-a')?.scope).toBe('Column')
    expect(headers.get('z-col-b')?.scope).toBe('Column')
    expect(headers.get('z-row-1')?.scope).toBe('Row')
  })

  it('treats the first row as the header row when there is no THead', () => {
    expect(headers.get('a-1')?.scope).toBe('Column')
    expect(headers.get('a-2')?.scope).toBe('Column')
    expect(headers.get('a-3')?.scope).toBe('Row')
  })

  it('scopes every header cell', () => {
    expect(headers.size).toBe(7)
    for (const [, info] of headers) expect(info.scope).toBeDefined()
  })

  it('adds a /Table attribute dict next to attributes owned by other owners', () => {
    const attrs = headers.get('z-col-b')!.attrs
    expect(attrs).toHaveLength(2)
    const layout = attrs.find((dict) => dict.get(n('O')) === n('Layout'))
    expect(layout?.get(n('Width'))?.toString()).toBe('40')
  })

  it('reuses an existing /Table attribute dict without dropping its entries', () => {
    const attrs = headers.get('z-row-1')!.attrs
    expect(attrs).toHaveLength(1)
    expect(attrs[0]!.get(n('ColSpan'))?.toString()).toBe('1')
    expect(attrs[0]!.get(n('Scope'))).toBe(n('Row'))
  })

  it('does not overwrite an existing /Scope', () => {
    expect(headers.get('z-row-2')?.scope).toBe('Both')
  })

  it('adds a sorted /IDTree that maps every ID to its element', () => {
    const root = doc.catalog.lookup(n('StructTreeRoot'), PDFDict)
    const tree = root.lookup(n('IDTree'), PDFDict)
    const names = tree.lookup(n('Names'), PDFArray).asArray()
    expect(names).toHaveLength(7 * 2)

    const keys: string[] = []
    for (let i = 0; i < names.length; i += 2) {
      const key = names[i] as PDFString
      const target = doc.context.lookup(names[i + 1])
      keys.push(key.decodeText())
      expect(target).toBeInstanceOf(PDFDict)
      expect((target as PDFDict).get(n('ID'))?.toString()).toBe(key.toString())
    }
    expect(keys).toEqual([...keys].sort())
    expect(keys[0]).toBe('a-1')
  })

  it('keeps /ParentTree and /MarkInfo intact', () => {
    const root = doc.catalog.lookup(n('StructTreeRoot'), PDFDict)
    expect(root.has(n('ParentTree'))).toBe(true)
    expect(root.has(n('ParentTreeNextKey'))).toBe(true)
    expect(doc.catalog.lookup(n('MarkInfo'), PDFDict).get(n('Marked'))?.toString()).toBe('true')
  })

  it('does not add an /IDTree when one already exists', async () => {
    const twice = await PDFDocument.load(await fixTableHeaders(output))
    const root = twice.catalog.lookup(n('StructTreeRoot'), PDFDict)
    const names = root.lookup(n('IDTree'), PDFDict).lookup(n('Names'), PDFArray)
    expect(names.size()).toBe(7 * 2)
  })

  it('returns an untagged PDF unchanged', async () => {
    const plain = await PDFDocument.create()
    plain.addPage()
    const bytes = await plain.save()
    expect(await fixTableHeaders(bytes)).toBe(bytes)
  })
})
