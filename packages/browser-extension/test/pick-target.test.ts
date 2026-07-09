// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { getPickTarget, recoverSkippedTarget } from '../src/content/picker/pick-target'

describe('getPickTarget', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns a content-bearing hit unchanged', () => {
    document.body.innerHTML = '<div id="t">hello</div>'
    const el = document.getElementById('t')!
    expect(getPickTarget(el)).toBe(el)
  })

  it('keeps a content-less <button> nested inside an <a> selectable (does not promote to the <a>)', () => {
    document.body.innerHTML = '<a href="#" id="link"><button id="btn"><svg></svg></button></a>'
    const btn = document.getElementById('btn')!
    // Hovering the button's own (icon-only) area resolves to the button, not the wrapping link.
    expect(getPickTarget(btn)).toBe(btn)
  })

  it('keeps a content-less <a> nested inside a <button> selectable (does not promote to the <button>)', () => {
    document.body.innerHTML = '<button id="btn"><a href="#" id="inner"><svg></svg></a></button>'
    const inner = document.getElementById('inner')!
    expect(getPickTarget(inner)).toBe(inner)
  })

  it('promotes a content-less wrapper up to the nearest interactive <a>', () => {
    document.body.innerHTML = '<a href="#" id="link"><div id="wrap"></div></a>'
    const wrap = document.getElementById('wrap')!
    expect(getPickTarget(wrap)).toBe(document.getElementById('link'))
  })

  it('keeps a native <button> inside a custom-element (web-component) wrapper selectable', () => {
    document.body.innerHTML = '<my-btn id="host"><button id="btn"><svg></svg></button></my-btn>'
    const btn = document.getElementById('btn')!
    expect(getPickTarget(btn)).toBe(btn)
  })

  it('keeps a native <button> selectable when a custom element sits between it and an <a>', () => {
    document.body.innerHTML =
      '<a href="#" id="link"><wrap-el><button id="btn"><svg></svg></button></wrap-el></a>'
    const btn = document.getElementById('btn')!
    expect(getPickTarget(btn)).toBe(btn)
  })

  it('returns the hit when there is no interactive ancestor', () => {
    document.body.innerHTML = '<div id="wrap"><div id="inner"></div></div>'
    const inner = document.getElementById('inner')!
    expect(getPickTarget(inner)).toBe(inner)
  })

  it('promotes an <input> to its wrapper when a sibling holds an <svg> icon adornment', () => {
    document.body.innerHTML =
      '<div id="wrap"><input id="field" /><span id="icon"><svg></svg></span></div>'
    const field = document.getElementById('field')!
    expect(getPickTarget(field)).toBe(document.getElementById('wrap'))
  })

  it('promotes an <input> to its wrapper when a sibling holds a CSS-mask icon (Iconify/Lucide)', () => {
    document.body.innerHTML =
      '<div id="wrap"><input id="field" /><span id="icon" style="mask-image:url(#i)"></span></div>'
    const field = document.getElementById('field')!
    expect(getPickTarget(field)).toBe(document.getElementById('wrap'))
  })

  it('does not promote a plain <input> with no icon sibling', () => {
    document.body.innerHTML = '<div id="wrap"><input id="field" /></div>'
    const field = document.getElementById('field')!
    expect(getPickTarget(field)).toBe(field)
  })

  it('does not promote an <input> when the icon sibling is a separately-selectable button', () => {
    document.body.innerHTML =
      '<form id="form"><input id="field" /><button id="btn"><svg></svg></button></form>'
    const field = document.getElementById('field')!
    expect(getPickTarget(field)).toBe(field)
  })
})

describe('recoverSkippedTarget', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  // happy-dom has no layout engine, so getBoundingClientRect returns zeros. Stub it per element.
  function stubRect(el: Element, x: number, y: number, w: number, h: number): void {
    el.getBoundingClientRect = () =>
      ({
        left: x,
        top: y,
        right: x + w,
        bottom: y + h,
        width: w,
        height: h,
        x,
        y,
        toJSON() {}
      }) as DOMRect
  }

  it('recovers a pointer-events:none disabled button the hit test skipped', () => {
    document.body.innerHTML =
      '<a href="#" id="link"><button id="btn" disabled style="pointer-events:none">Buy</button></a>'
    const link = document.getElementById('link')!
    const btn = document.getElementById('btn')!
    stubRect(btn, 10, 10, 100, 30)
    expect(recoverSkippedTarget(link, 50, 20)).toBe(btn)
  })

  it('is a no-op when the interactive descendant is normally hit-testable', () => {
    document.body.innerHTML = '<a href="#" id="link"><button id="btn">Buy</button></a>'
    const link = document.getElementById('link')!
    stubRect(document.getElementById('btn')!, 10, 10, 100, 30)
    expect(recoverSkippedTarget(link, 50, 20)).toBe(link)
  })

  it('is a no-op when the cursor is outside the skipped element box', () => {
    document.body.innerHTML =
      '<a href="#" id="link"><button id="btn" disabled style="pointer-events:none">Buy</button></a>'
    const link = document.getElementById('link')!
    stubRect(document.getElementById('btn')!, 10, 10, 100, 30)
    expect(recoverSkippedTarget(link, 500, 500)).toBe(link)
  })

  it('ignores decorative pointer-events:none elements — only recovers interactive ones', () => {
    document.body.innerHTML =
      '<section id="wrap"><div id="scrim" style="pointer-events:none"></div></section>'
    const wrap = document.getElementById('wrap')!
    stubRect(document.getElementById('scrim')!, 0, 0, 200, 200)
    expect(recoverSkippedTarget(wrap, 50, 50)).toBe(wrap)
  })

  it('prefers the deepest skipped interactive element when nested', () => {
    document.body.innerHTML =
      '<a href="#" id="hit"><div id="outer" role="group" style="pointer-events:none"><button id="btn" disabled style="pointer-events:none">x</button></div></a>'
    const hit = document.getElementById('hit')!
    stubRect(document.getElementById('outer')!, 0, 0, 200, 200)
    stubRect(document.getElementById('btn')!, 10, 10, 100, 30)
    expect(recoverSkippedTarget(hit, 50, 20)).toBe(document.getElementById('btn'))
  })
})
