interface AdminStatus {
  configured: boolean
  authenticated: boolean
  dev: boolean
}

function useAdminAuth() {
  const status = useState<AdminStatus | undefined>('admin-status', () => undefined)

  async function refresh() {
    status.value = await $fetch<AdminStatus>('/api/admin/status')
  }

  async function login(secret: string) {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { secret }
    })
    await refresh()
  }

  const isAuthenticated = computed(() => {
    const s = status.value
    if (!s) return false
    if (s.dev && !s.configured) return true
    return s.authenticated
  })

  return { status, refresh, login, isAuthenticated }
}

export { useAdminAuth }
export type { AdminStatus }
