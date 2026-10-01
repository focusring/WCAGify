import { z } from 'zod'
import { issueSchema, reportSchema } from './schemas'

/**
 * A node of Nuxt Content's compact markdown tree: text, or an element as
 * `[tag, props, ...children]`.
 */
type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

const minimarkPropsSchema = z.record(z.string(), z.unknown())

const minimarkNodeSchema: z.ZodType<MinimarkNode> = z.lazy(() =>
  z.union([z.string(), z.tuple([z.string(), minimarkPropsSchema], minimarkNodeSchema)])
)

/**
 * The table of contents Nuxt Content stores with a body. Nothing renders it,
 * so any object is kept as is. Typed as `object` rather than an index
 * signature: Nuxt Content's `Toc` is an interface, and an interface is not
 * assignable to an index signature, so its collection items would not fit
 * `ReportDocument` and `IssueDocument`.
 */
const tocSchema: z.ZodType<object> = z.looseObject({})

/**
 * A parsed markdown body as Nuxt Content v3 stores it. Code blocks are already
 * highlighted, so rendering the body needs no Shiki.
 */
const minimarkSchema = z.object({
  type: z.literal('minimark'),
  value: z.array(minimarkNodeSchema),
  toc: tocSchema.optional()
})

type Minimark = z.output<typeof minimarkSchema>

const reportPath = /^\/reports\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const issuePath = /^\/reports\/[a-z0-9]+(?:-[a-z0-9]+)*\/.+$/

const pageFields = {
  title: z.string().trim().min(1),
  description: z.string().optional(),
  body: minimarkSchema
}

/**
 * A report as the report components render it: the frontmatter of
 * `reportSchema` plus the page fields Nuxt Content adds. Any other field of a
 * Nuxt Content item (`id`, `stem`, `seo`, `meta`, `navigation`) is stripped.
 */
const reportDocumentSchema = reportSchema.extend({
  ...pageFields,
  path: z.string().regex(reportPath)
})

/** An issue or tip as the report components render it; see `reportDocumentSchema`. */
const issueDocumentSchema = issueSchema.extend({
  ...pageFields,
  path: z.string().regex(issuePath)
})

type ReportDocument = z.output<typeof reportDocumentSchema>
type IssueDocument = z.output<typeof issueDocumentSchema>

export { minimarkSchema, reportDocumentSchema, issueDocumentSchema }
export type { MinimarkNode, Minimark, ReportDocument, IssueDocument }
