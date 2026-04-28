// Set toolbar icon based on browser color scheme
function updateIcon(isDark: boolean) {
  const prefix = isDark ? 'light' : 'dark'
  chrome.action.setIcon({
    path: {
      '16': `src/assets/wcagify-${prefix}-16.png`,
      '48': `src/assets/wcagify-${prefix}-48.png`
    }
  })
}

// Listen for color scheme changes
if (globalThis.matchMedia) {
  const mq = globalThis.matchMedia('(prefers-color-scheme: dark)')
  updateIcon(mq.matches)
  mq.addEventListener('change', (e) => updateIcon(e.matches))
}

// Click extension icon -> open side panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId })
  }
})
