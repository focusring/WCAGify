interface AdminStatus {
  configured: boolean
  authenticated: boolean
  dev: boolean
}

function useAdminAuth() {
  const status = useState<AdminStatus | undefined>('admin-status', () => undefined)
  const requestFetch = useRequestFetch()

  async function refresh() {
    status.value = await requestFetch<AdminStatus>('/api/admin/status')
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
    if (!s.configured) return true
    return s.authenticated
  })

  return { status, refresh, login, isAuthenticated }
}

export { useAdminAuth }
export type { AdminStatus }
