// Shared shapes for the element picker's detection modules.

export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

export interface GradientInfo {
  type: string
  colors: string[]
}

// How reachable an <iframe>'s inner content is (see probeIframe):
//   • content      — same-origin document with rendered content; detection runs on it
//   • empty        — same-origin document whose body has no content yet (e.g. an about:blank ad slot before its script fills it)
//   • cross-origin — the same-origin policy blocks all access to the inner document
//   • inaccessible — reachable in principle but no usable document (detached / mid-navigation)
export type IframeState = 'content' | 'empty' | 'cross-origin' | 'inaccessible'

export interface MediaInfo {
  kind: 'image' | 'video' | 'iframe'
  format: string // extension/format, '' when undeterminable (always '' for iframe)
  iframeState?: IframeState // set only when kind === 'iframe'
}

export interface BackgroundInfo {
  color: string // formatted background-color behind the media, '' when transparent/none
  media: MediaInfo | null // background image/video (kind + format), null when none
  gradient: GradientInfo | null // gradient stop colors (formatted), null when not a gradient
  blur: boolean // a blur() in filter / backdrop-filter
}

// The full set of detected values for one element. Produced for the picked element and for each surfaced nested child, so both render through the same section component.
// Colors are raw (rgb/rgba) here; the popup converts them to hex.
export interface ElementInfo {
  selector: string
  role: string // computed ARIA role (display role for children), '' when none
  ariaHidden: boolean // removed from the a11y tree (aria-hidden / inert)
  disabled: boolean // :disabled form control or aria-disabled
  label: string // accessible-name/text snippet, for distinguishing same-role children
  hasHoverStyles: boolean // a :hover rule in the element's own document styles it (values not captured — getComputedStyle reads the current state only)
  count?: number // >1 when identical child sections were merged into this one (e.g. "Button ×3"); unset on the selected element
  textColors: string[]
  iconColors: string[]
  // Where each text/icon color was found, index-aligned with the arrays above (e.g. ['h1', 'td ×3'] for textColors[0]).
  // Optional because history entries saved before these existed restore without them.
  // Presentational only, so they stay out of the section merge key see sectionKey.
  textColorSources?: string[][]
  iconColorSources?: string[][]
  elementColor: string
  elementGradient: GradientInfo | null
  background: BackgroundInfo
  borderColors: string[]
  ringColors: string[]
  boxShadowColors: string[]
  outlineColor: string
  media: MediaInfo | null
}
