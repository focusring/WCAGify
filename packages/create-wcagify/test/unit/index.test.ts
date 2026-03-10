import { describe, it, expect } from 'vitest'
import { VERSION, create, runCli } from '../../src/index'

describe('index exports', () => {
  it('exports VERSION as a string', () => {
    expect(typeof VERSION).toBe('string')
    expect(VERSION.length).toBeGreaterThan(0)
  })

  it('exports create as a function', () => {
    expect(typeof create).toBe('function')
  })

  it('exports runCli as a function', () => {
    expect(typeof runCli).toBe('function')
  })
})
