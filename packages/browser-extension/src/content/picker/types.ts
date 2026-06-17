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
