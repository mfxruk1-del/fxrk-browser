import { useEffect } from 'react'
import { useBrowserStore } from '../stores/browserStore'
import { useUIStore } from '../stores/uiStore'

// ============================================================
// useKeyboardShortcuts - Global keyboard shortcut registration
// Handles shortcuts at the renderer level (webview shortcuts
// are handled by Electron's webContents accelerators)
// ============================================================

interface ShortcutHandlers {
  openTab: () => void
  closeTab: (id: string) => void
  switchTab: (id: string) => void
  navigate: (url: string) => void
  goBack: () => void
  goForward: () => void
  refresh: () => void
  reopenClosed: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { tabs, activeTabId } = useBrowserStore()
  const { setFindOpen, openSettings, toggleSidebar } = useUIStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const alt = e.altKey
      const key = e.key.toLowerCase()

      // Ctrl+T → new tab
      if (ctrl && !shift && key === 't') {
        e.preventDefault()
        handlers.openTab()
        return
      }

      // Ctrl+W → close current tab
      if (ctrl && !shift && key === 'w') {
        e.preventDefault()
        if (activeTabId) handlers.closeTab(activeTabId)
        return
      }

      // Ctrl+Shift+T → reopen closed tab
      if (ctrl && shift && key === 't') {
        e.preventDefault()
        handlers.reopenClosed()
        return
      }

      // Ctrl+Tab → next tab
      if (ctrl && !shift && key === 'tab') {
        e.preventDefault()
        const idx = tabs.findIndex(t => t.id === activeTabId)
        const next = tabs[(idx + 1) % tabs.length]
        if (next) handlers.switchTab(next.id)
        return
      }

      // Ctrl+Shift+Tab → previous tab
      if (ctrl && shift && key === 'tab') {
        e.preventDefault()
        const idx = tabs.findIndex(t => t.id === activeTabId)
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
        if (prev) handlers.switchTab(prev.id)
        return
      }

      // Ctrl+1..9 → switch to tab N
      if (ctrl && !shift && key >= '1' && key <= '9') {
        e.preventDefault()
        const idx = parseInt(key) - 1
        if (tabs[idx]) handlers.switchTab(tabs[idx].id)
        return
      }

      // Alt+Left → back
      if (alt && key === 'arrowleft') {
        e.preventDefault()
        handlers.goBack()
        return
      }

      // Alt+Right → forward
      if (alt && key === 'arrowright') {
        e.preventDefault()
        handlers.goForward()
        return
      }

      // Ctrl+R / F5 → refresh
      if ((ctrl && key === 'r') || key === 'f5') {
        e.preventDefault()
        handlers.refresh()
        return
      }

      // Ctrl+L → focus URL bar (emit event)
      if (ctrl && key === 'l') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('fxrk:focusUrlBar'))
        return
      }

      // Ctrl+F → find in page
      if (ctrl && !shift && key === 'f') {
        e.preventDefault()
        setFindOpen(true)
        return
      }

      // Escape → close find / close modals
      if (key === 'escape') {
        setFindOpen(false)
        return
      }

      // Ctrl+, → settings
      if (ctrl && key === ',') {
        e.preventDefault()
        openSettings()
        return
      }

      // Ctrl+B → bookmarks panel
      if (ctrl && !shift && key === 'b') {
        e.preventDefault()
        toggleSidebar('bookmarks')
        return
      }

      // Ctrl+H → history panel
      if (ctrl && !shift && key === 'h') {
        e.preventDefault()
        toggleSidebar('history')
        return
      }

      // Ctrl+J → downloads panel
      if (ctrl && !shift && key === 'j') {
        e.preventDefault()
        toggleSidebar('downloads')
        return
      }

      // Ctrl+Shift+P → phone panel
      if (ctrl && shift && key === 'p') {
        e.preventDefault()
        toggleSidebar('phone')
        return
      }

      // Ctrl+Shift+B → toggle sidebar
      if (ctrl && shift && key === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Ctrl+= → zoom in
      if (ctrl && (key === '=' || key === '+')) {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('fxrk:zoomIn'))
        return
      }

      // Ctrl+- → zoom out
      if (ctrl && key === '-') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('fxrk:zoomOut'))
        return
      }

      // Ctrl+0 → reset zoom
      if (ctrl && key === '0') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('fxrk:zoomReset'))
        return
      }

      // Ctrl+D → bookmark page
      if (ctrl && key === 'd') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('fxrk:bookmarkPage'))
        return
      }

      // F11 → fullscreen
      if (key === 'f11') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('fxrk:toggleFullscreen'))
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, handlers, setFindOpen, openSettings, toggleSidebar])
}
