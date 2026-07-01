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

export interface MediaInfo {
  kind: 'image' | 'video'
  format: string // extension/format, '' when undeterminable
}

export interface BackgroundInfo {
  color: string // formatted background-color behind the media, '' when transparent/none
  media: MediaInfo | null // background image/video (kind + format), null when none
  gradient: GradientInfo | null // gradient stop colors (formatted), null when not a gradient
  blur: boolean // a blur() in filter / backdrop-filter
}

// The full set of detected values for one element. Produced for the picked element and for each surfaced nested child,
// so both render through the same section component. Colors are raw (rgb/rgba) here; the popup converts them to hex.
export interface ElementInfo {
  selector: string
  role: string // computed ARIA role (display role for children), '' when none
  ariaHidden: boolean // removed from the a11y tree (aria-hidden / inert)
  disabled: boolean // :disabled form control or aria-disabled
  label: string // accessible-name/text snippet, for distinguishing same-role children
  textColors: string[]
  iconColors: string[]
  elementColor: string
  elementGradient: GradientInfo | null
  background: BackgroundInfo
  borderColors: string[]
  ringColors: string[]
  boxShadowColors: string[]
  outlineColor: string
  media: MediaInfo | null
}
