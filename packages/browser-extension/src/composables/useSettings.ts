import { ref, watch } from 'vue'

const wcagifyUrl = ref('http://localhost:3000')
const reportSlug = ref('')

let ready = false
let loadPromise: Promise<void> | null = null

async function doLoad() {
  const result = await chrome.storage.local.get(['wcagifyUrl', 'reportSlug'])
  if (result.wcagifyUrl) wcagifyUrl.value = result.wcagifyUrl as string
  if (result.reportSlug) reportSlug.value = result.reportSlug as string
  ready = true
}

function load() {
  if (!loadPromise) loadPromise = doLoad()
  return loadPromise
}

watch(wcagifyUrl, (val) => {
  if (ready && /^https?:\/\//.test(val)) chrome.storage.local.set({ wcagifyUrl: val })
})
watch(reportSlug, (val) => {
  if (ready) chrome.storage.local.set({ reportSlug: val })
})

export function useSettings() {
  load()
  return { wcagifyUrl, reportSlug }
}
