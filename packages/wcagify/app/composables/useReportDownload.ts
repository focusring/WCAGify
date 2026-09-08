/**
 * Downloads a generated report file (PDF or EARL JSON-LD) from an API route
 * and hands it to the browser as a file, tracking which format is in flight.
 */
export function useReportDownload() {
  const downloading = ref<string>()

  async function download(url: string, filename: string, format: string) {
    downloading.value = format
    try {
      const response = await $fetch<Blob>(url, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(response)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } finally {
      downloading.value = undefined
    }
  }

  return { downloading, download }
}
