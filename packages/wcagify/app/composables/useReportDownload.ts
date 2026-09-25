export type ReportDownloadFormat = 'pdf' | 'earl'

/**
 * Downloads a generated report file (PDF or EARL JSON-LD) from an API route
 * and hands it to the browser as a file, tracking which format is in flight.
 *
 * `status` holds a short message for a `role="status"` live region that is
 * present at page load: "Generating…", "downloaded" or an error. The buttons
 * stay focusable while a download runs (`aria-disabled` instead of `disabled`)
 * so keyboard focus does not fall back to the document.
 */
export function useReportDownload() {
  const { t } = useI18n()
  const downloading = ref<ReportDownloadFormat>()
  const status = ref('')

  async function download(url: string, filename: string, format: ReportDownloadFormat) {
    // One download at a time.
    // Otherwise a second click during a pending request re-enables both buttons early.
    if (downloading.value) return
    downloading.value = format
    status.value = t(`report.downloadStatus.${format}.generating`)
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
      status.value = t(`report.downloadStatus.${format}.done`)
    } catch {
      status.value = t(`report.downloadStatus.${format}.error`)
    } finally {
      downloading.value = undefined
    }
  }

  /**
   * Props for a download button. Not UButton's `loading`/`disabled`: those set
   * the `disabled` attribute, which drops keyboard focus to the page while the
   * file is generated.
   */
  function buttonProps(format: ReportDownloadFormat, icon: string) {
    const busy = downloading.value === format
    return {
      icon: busy ? 'i-lucide-loader-circle' : icon,
      ui: { leadingIcon: busy ? 'animate-spin' : undefined },
      class: 'aria-disabled:opacity-75 aria-disabled:cursor-not-allowed',
      'aria-disabled': downloading.value ? 'true' : undefined,
      'aria-busy': busy ? 'true' : undefined
    }
  }

  return { downloading, status, download, buttonProps }
}
