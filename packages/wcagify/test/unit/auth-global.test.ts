import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useAdminAuth } from '../../app/composables/useAdminAuth'

/**
 * auth.global.ts calls defineNuxtRouteMiddleware(fn) at module top level, so that stub must exist
 * on globalThis *before* the module is evaluated — hence the dynamic import below, after the stubs
 * are registered, rather than a hoisted static import. useAdminAuth is the real composable (imported
 * above and exposed as a global, same as Nuxt's auto-import would), so this exercises the actual
 * integration between the middleware and the composable, not a mocked stand-in for either.
 */
const stateMap = new Map<string, ReturnType<typeof ref>>()
function useState<T>(key: string, init?: () => T) {
  if (!stateMap.has(key)) stateMap.set(key, ref(init ? init() : undefined))
  return stateMap.get(key)!
}

const requestFetchMock = vi.fn()
const navigateToMock = vi.fn((opts: unknown) => ({ __navigateTo: opts }))

vi.stubGlobal('useState', useState)
vi.stubGlobal('useRequestFetch', () => requestFetchMock)
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAdminAuth', useAdminAuth)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
vi.stubGlobal('navigateTo', navigateToMock)

const authMiddleware = (await import('../../app/middleware/auth.global')).default

// RouteMiddleware is (to, from). auth.global only reads to, so every call below passes a throwaway from.
function route(path: string): Parameters<typeof authMiddleware>[0] {
  return { path, fullPath: path } as Parameters<typeof authMiddleware>[0]
}

describe('auth.global middleware', () => {
  beforeEach(() => {
    stateMap.clear()
    requestFetchMock.mockReset()
    navigateToMock.mockClear()
  })

  it('skips gating entirely for share links and the login page', async () => {
    await authMiddleware(route('/share/abc123'), route('/'))
    await authMiddleware(route('/login'), route('/'))
    expect(requestFetchMock).not.toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('allows navigation when the instance is unconfigured (open access)', async () => {
    requestFetchMock.mockResolvedValue({ configured: false, authenticated: false, dev: false })
    const result = await authMiddleware(route('/reports/foo'), route('/'))
    expect(result).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('redirects to /login with the intended path when not authenticated', async () => {
    requestFetchMock.mockResolvedValue({ configured: true, authenticated: false, dev: false })
    await authMiddleware(route('/reports/foo'), route('/'))
    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/reports/foo' }
    })
  })

  it('allows navigation when authenticated', async () => {
    requestFetchMock.mockResolvedValue({ configured: true, authenticated: true, dev: false })
    const result = await authMiddleware(route('/reports/foo'), route('/'))
    expect(result).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('re-checks status on every navigation rather than trusting a stale cached value', async () => {
    requestFetchMock.mockResolvedValueOnce({ configured: true, authenticated: true, dev: false })
    await authMiddleware(route('/reports/foo'), route('/'))
    expect(navigateToMock).not.toHaveBeenCalled()

    // Session expires server-side between navigations.
    requestFetchMock.mockResolvedValueOnce({ configured: true, authenticated: false, dev: false })
    await authMiddleware(route('/settings'), route('/'))
    expect(requestFetchMock).toHaveBeenCalledTimes(2)
    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/settings' }
    })
  })
})
