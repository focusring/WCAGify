import { ref } from 'vue'
import type { Report } from '../types'

interface DiscoveredInstance {
  url: string
  reports: Report[]
  label: string
}

const PORTS = [
  3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 4000, 5000, 5173, 8000, 8080,
  8888
]

async function probePort(
  port: number,
  signal: AbortSignal
): Promise<DiscoveredInstance | undefined> {
  const url = `http://localhost:${port}`
  try {
    const res = await fetch(`${url}/api/reports`, { signal })
    if (!res.ok) return undefined
    const data = await res.json()
    if (!Array.isArray(data)) return undefined
    const reports = data as Report[]
    const count = reports.length
    const label = count === 1 ? `${url} (1 report)` : `${url} (${count} reports)`
    return { url, reports, label }
  } catch {
    return undefined
  }
}

export function useInstanceDiscovery() {
  const instances = ref<DiscoveredInstance[]>([])
  const scanStatus = ref<'idle' | 'scanning' | 'done'>('idle')

  let abortController: AbortController | undefined

  async function scan() {
    abort()
    abortController = new AbortController()
    const { signal } = abortController

    scanStatus.value = 'scanning'
    instances.value = []

    const results = await Promise.allSettled(PORTS.map((port) => probePort(port, signal)))

    if (signal.aborted) return

    instances.value = results
      .map((r) => (r.status === 'fulfilled' ? r.value : undefined))
      .filter((r): r is DiscoveredInstance => r !== undefined)

    scanStatus.value = 'done'
  }

  function abort() {
    abortController?.abort()
    abortController = undefined
  }

  return { instances, scanStatus, scan, abort }
}
