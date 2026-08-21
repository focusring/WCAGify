import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref } from 'vue'

/**
 * useAdminAuth relies on Nuxt auto-imports (useState, useRequestFetch, $fetch, computed) that
 * don't exist in plain vitest. useState is stubbed with a shared-ref-by-key stand-in, since the
 * composable's correctness — every useAdminAuth() call must see the same status — is exactly what
 * the ReportShareSlideover and auth.global regressions this test guards against depended on.
 */
const stateMap = new Map<string, ReturnType<typeof ref>>()
function useState<T>(key: string, init?: () => T) {
  if (!stateMap.has(key)) stateMap.set(key, ref(init ? init() : undefined))
  return stateMap.get(key)!
}

const requestFetchMock = vi.fn()
const fetchMock = vi.fn()

vi.stubGlobal('useState', useState)
vi.stubGlobal('useRequestFetch', () => requestFetchMock)
vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('computed', computed)

const { useAdminAuth } = await import('../../app/composables/useAdminAuth')

describe('useAdminAuth', () => {
  beforeEach(() => {
    stateMap.clear()
    requestFetchMock.mockReset()
    fetchMock.mockReset()
  })

  it('is unauthenticated before the first refresh', () => {
    const { isAuthenticated } = useAdminAuth()
    expect(isAuthenticated.value).toBe(false)
  })

  it('treats an unconfigured instance as authenticated (open access)', async () => {
    requestFetchMock.mockResolvedValue({ configured: false, authenticated: false, dev: false })
    const { refresh, isAuthenticated } = useAdminAuth()
    await refresh()
    expect(isAuthenticated.value).toBe(true)
  })

  it('is unauthenticated when configured and not logged in', async () => {
    requestFetchMock.mockResolvedValue({ configured: true, authenticated: false, dev: false })
    const { refresh, isAuthenticated } = useAdminAuth()
    await refresh()
    expect(isAuthenticated.value).toBe(false)
  })

  it('is authenticated when configured and logged in', async () => {
    requestFetchMock.mockResolvedValue({ configured: true, authenticated: true, dev: false })
    const { refresh, isAuthenticated } = useAdminAuth()
    await refresh()
    expect(isAuthenticated.value).toBe(true)
  })

  it('shares status across every call site (single global state)', async () => {
    requestFetchMock.mockResolvedValue({ configured: true, authenticated: true, dev: false })
    const a = useAdminAuth()
    await a.refresh()
    const b = useAdminAuth()
    expect(b.isAuthenticated.value).toBe(true)
    expect(b.status.value).toEqual(a.status.value)
  })

  it('login posts the secret then refreshes status, updating every instance', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    requestFetchMock.mockResolvedValue({ configured: true, authenticated: true, dev: false })
    const a = useAdminAuth()
    const b = useAdminAuth()
    expect(b.isAuthenticated.value).toBe(false)
    await a.login('the-secret')
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/login', {
      method: 'POST',
      body: { secret: 'the-secret' }
    })
    expect(b.isAuthenticated.value).toBe(true)
  })

  it('propagates a login failure without marking anyone authenticated', async () => {
    fetchMock.mockRejectedValue(new Error('Invalid admin secret'))
    const { login, isAuthenticated } = useAdminAuth()
    await expect(login('wrong')).rejects.toThrow('Invalid admin secret')
    expect(isAuthenticated.value).toBe(false)
  })
})
