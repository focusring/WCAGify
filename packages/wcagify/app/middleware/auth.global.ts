export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/share/') || to.path === '/login') return

  const { refresh, isAuthenticated } = useAdminAuth()

  await refresh()

  if (!isAuthenticated.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
