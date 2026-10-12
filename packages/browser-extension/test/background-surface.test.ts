// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { firstSolidBackgroundColor, getBackgroundInfo } from '../src/content/picker/background'

// The surface walk must cross a shadow boundary (parentElement is null there, so it used to stop inside the component).
// Slot and frame hops aren't testable: happy-dom lacks assignedSlot and frameElement. Fixtures use the background-color
// longhand because happy-dom doesn't expand the `background` shorthand.

// <div#page> → <my-el#host> ‖ shadow: <div#card> → <b#text>
function buildComponent(pageStyle: string, hostStyle: string, cardStyle: string): Element {
  document.body.innerHTML = `<div id="page" ${pageStyle}><my-el id="host" ${hostStyle}></my-el></div>`
  const shadow = document.getElementById('host')!.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<div id="card" ${cardStyle}><b id="text">t</b></div>`
  return shadow.getElementById('text')!
}

const bg = (color: string): string => `style="background-color: ${color}"`

describe('surface walk across a shadow boundary', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('reads past the shadow root to the host component surface', () => {
    const text = buildComponent('', bg('rgb(40, 50, 60)'), '')
    expect(getBackgroundInfo(text).color).toBe('rgb(40, 50, 60)')
    expect(firstSolidBackgroundColor(text)).toEqual({ r: 40, g: 50, b: 60, a: 255 })
  })

  it('keeps climbing into the light DOM above the host', () => {
    const text = buildComponent(bg('rgb(10, 20, 30)'), '', '')
    expect(getBackgroundInfo(text).color).toBe('rgb(10, 20, 30)')
    expect(firstSolidBackgroundColor(text)).toEqual({ r: 10, g: 20, b: 30, a: 255 })
  })

  it('still takes the nearest surface, shadow-side first', () => {
    const text = buildComponent(bg('rgb(10, 20, 30)'), bg('rgb(40, 50, 60)'), bg('rgb(70, 80, 90)'))
    expect(getBackgroundInfo(text).color).toBe('rgb(70, 80, 90)')
  })

  it('reports nothing when the whole chain is transparent', () => {
    const text = buildComponent('', '', '')
    expect(getBackgroundInfo(text).color).toBe('')
    expect(firstSolidBackgroundColor(text)).toBeNull()
  })
})
