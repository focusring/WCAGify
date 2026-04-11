import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock chrome before imports
Object.defineProperty(globalThis, 'chrome', {
  value: {
    storage: { local: { get: vi.fn(async () => ({})), set: vi.fn() } },
    runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } }
  },
  writable: true
})

const fetchMock = vi.fn()
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true })

const { useInstanceDiscovery } = await import('../src/composables/useInstanceDiscovery')

function jsonResponse(data: unknown, ok = true) {
  return { ok, json: async () => data }
}

describe('useInstanceDiscovery', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    const { abort } = useInstanceDiscovery()
    abort()
  })

  it('includes settings from /api/settings when available', async () => {
    const reports = [
      { slug: 'test', title: 'Test', sample: [], wcagVersion: '2.2', targetLevel: 'AA' }
    ]
    const settings = { accentColor: 'blue', neutralColor: 'zinc', locale: 'nl' }

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/reports')) return jsonResponse(reports)
      if (url.includes('/api/settings')) return jsonResponse(settings)
      return jsonResponse(null, false)
    })

    const { scan, instances, scanStatus } = useInstanceDiscovery()
    await scan()

    expect(scanStatus.value).toBe('done')
    const found = instances.value.find((i) => i.url === 'http://localhost:3000')
    expect(found).toBeDefined()
    expect(found!.settings).toEqual(settings)
    expect(found!.reports).toEqual(reports)
  })

  it('still discovers instance when /api/settings fails', async () => {
    const reports = [{ slug: 'r1', title: 'R1', sample: [], wcagVersion: '2.2', targetLevel: 'AA' }]

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/reports')) return jsonResponse(reports)
      if (url.includes('/api/settings')) throw new Error('Not found')
      return jsonResponse(null, false)
    })

    const { scan, instances, scanStatus } = useInstanceDiscovery()
    await scan()

    expect(scanStatus.value).toBe('done')
    const found = instances.value.find((i) => i.url === 'http://localhost:3000')
    expect(found).toBeDefined()
    expect(found!.settings).toBeUndefined()
    expect(found!.reports).toEqual(reports)
  })

  it('sets settings to undefined when /api/settings returns non-ok', async () => {
    const reports = [{ slug: 'r1', title: 'R1', sample: [], wcagVersion: '2.2', targetLevel: 'AA' }]

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/reports')) return jsonResponse(reports)
      if (url.includes('/api/settings')) return jsonResponse(null, false)
      return jsonResponse(null, false)
    })

    const { scan, instances } = useInstanceDiscovery()
    await scan()

    const found = instances.value.find((i) => i.url === 'http://localhost:3000')
    expect(found).toBeDefined()
    expect(found!.settings).toBeUndefined()
  })

  it('returns no instances when /api/reports fails', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('Connection refused')
    })

    const { scan, instances, scanStatus } = useInstanceDiscovery()
    await scan()

    expect(scanStatus.value).toBe('done')
    expect(instances.value).toHaveLength(0)
  })

  it('generates correct label for single report', async () => {
    const reports = [{ slug: 'r1', title: 'R1', sample: [], wcagVersion: '2.2', targetLevel: 'AA' }]

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/reports')) return jsonResponse(reports)
      if (url.includes('/api/settings')) return jsonResponse(null, false)
      return jsonResponse(null, false)
    })

    const { scan, instances } = useInstanceDiscovery()
    await scan()

    const found = instances.value.find((i) => i.url === 'http://localhost:3000')
    expect(found!.label).toBe('http://localhost:3000 (1 report)')
  })

  it('generates correct label for multiple reports', async () => {
    const reports = [
      { slug: 'r1', title: 'R1', sample: [], wcagVersion: '2.2', targetLevel: 'AA' },
      { slug: 'r2', title: 'R2', sample: [], wcagVersion: '2.2', targetLevel: 'AA' }
    ]

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/reports')) return jsonResponse(reports)
      if (url.includes('/api/settings')) return jsonResponse(null, false)
      return jsonResponse(null, false)
    })

    const { scan, instances } = useInstanceDiscovery()
    await scan()

    const found = instances.value.find((i) => i.url === 'http://localhost:3000')
    expect(found!.label).toBe('http://localhost:3000 (2 reports)')
  })
})
