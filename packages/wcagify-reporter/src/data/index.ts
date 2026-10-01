/**
 * The WCAG data the scoring is built on, for code that needs the raw tables,
 * such as WCAGify's EARL import and export. `scToSlug` maps each version,
 * language and success criterion to its anchor, name and level; `wcag20Ids`
 * maps a WCAG 2.1/2.2 anchor to its WCAG 2.0 anchor where they differ.
 */
export { default as scToSlug } from './sc-to-slug.json'
export { default as wcag20Ids } from './wcag20-ids.json'
