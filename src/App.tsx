import React, { useEffect, useCallback, useRef } from 'react'
import { TitleBar } from './components/layout/TitleBar'
import { TabBar } from './components/layout/TabBar'
import { Toolbar } from './components/layout/Toolbar'
import { StatusBar } from './components/layout/StatusBar'
import { Sidebar } from './components/panels/Sidebar'
import { TabContent } from './components/browser/TabContent'
import { CodeNotificationModal } from './components/modals/CodeNotificationModal'
import { FindInPageModal } from './components/modals/FindInPageModal'
import { ContextMenu } from './components/modals/ContextMenu'
import { ToastContainer } from './components/ui/Toast'
import { useBrowser } from './hooks/useBrowser'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { usePrivacy } from './hooks/usePrivacy'
import { useBrowserStore } from './stores/browserStore'
import { useUIStore } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'
import { v4 as uuidv4 } from 'uuid'
import type { AppSettings, Bookmark } from '../electron/utils/types'

const fxrk = window.fxrk

// ============================================================
// App - Root application component
// Manages the browser layout and wires together all subsystems
// ============================================================

export default function App() {
  const {
    tabs, activeTabId, activeTab,
    openTab, closeTab, switchTab, navigate, goBack, goForward, refresh, stop, goHome,
    reopenClosedTab, reorderTabs, findInPage, stopFind, setFindVisible,
  } = useBrowser()

  const { sidebarOpen } = useUIStore()
  const { setIsMaximized, addToast } = useUIStore()
  const { setSettings: setAppSettings } = useSettingsStore()
  const contentRef = useRef<HTMLDivElement>(null)

  // ── Initialize app on mount ───────────────────────────────
  useEffect(() => {
    // Load app settings
    fxrk.settings.get().then((s: AppSettings) => {
      setAppSettings(s)
    })

    // Open first tab
    if (tabs.length === 0) {
      fxrk.settings.get('startupBehavior').then(async (behavior: string) => {
        if (behavior === 'last-session') {
          const session = await fxrk.session.restore('default')
          if (session && session.tabsJson) {
            const savedTabs = JSON.parse(session.tabsJson)
            for (const tab of savedTabs) {
              await openTab(tab.url || 'fxrk://newtab', { background: true })
            }
            return
          }
        }
        openTab('fxrk://newtab')
      })
    }

    // Try auto-reconnect phone
    fxrk.phone.autoReconnect()

    // Listen for session save request
    const unsubSave = fxrk.app.onSaveSession(() => {
      fxrk.session.save(tabs, 'default')
    })

    // Listen for before-close to save session
    const unsubClose = fxrk.app.onBeforeClose(() => {
      fxrk.session.save(tabs, 'default')
    })

    // Window resize → update view bounds
    const unsubResize = fxrk.window.onResize(([w, h]: [number, number]) => {
      updateViewBounds(w, h)
    })

    return () => {
      unsubSave()
      unsubClose()
      unsubResize()
    }
  }, [])

  // ── Update BrowserView bounds when layout changes ─────────
  const updateViewBounds = useCallback((w?: number, h?: number) => {
    if (!contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    fxrk.window.setViewBounds({
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    })
  }, [])

  useEffect(() => {
    const observer = new ResizeObserver(() => updateViewBounds())
    if (contentRef.current) observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [updateViewBounds])

  // Update bounds whenever sidebar or active tab changes
  useEffect(() => {
    setTimeout(updateViewBounds, 150)
  }, [sidebarOpen, activeTabId, updateViewBounds])

  // ── Keyboard shortcuts ────────────────────────────────────
  useKeyboardShortcuts({
    openTab: () => openTab(),
    closeTab,
    switchTab,
    navigate,
    goBack,
    goForward,
    refresh,
    reopenClosed: reopenClosedTab,
  })

  // Handle keyboard shortcut events
  useEffect(() => {
    const handleZoomIn = () => {
      if (activeTabId && activeTab) {
        const newZoom = Math.min(activeTab.zoomLevel + 0.1, 3.0)
        fxrk.zoom.set(activeTabId, newZoom)
      }
    }
    const handleZoomOut = () => {
      if (activeTabId && activeTab) {
        const newZoom = Math.max(activeTab.zoomLevel - 0.1, 0.3)
        fxrk.zoom.set(activeTabId, newZoom)
      }
    }
    const handleZoomReset = () => {
      if (activeTabId) fxrk.zoom.set(activeTabId, 1.0)
    }
    const handleBookmark = async () => {
      if (!activeTab?.url || activeTab.url.startsWith('fxrk://')) return
      const existingId = await fxrk.bookmarks.isBookmarked(activeTab.url, 'default')
      if (existingId) {
        await fxrk.bookmarks.delete(existingId as string)
        addToast('Bookmark removed', 'info')
      } else {
        const bookmark: Bookmark = {
          id: uuidv4(),
          url: activeTab.url,
          title: activeTab.title || activeTab.url,
          favicon: activeTab.favicon || '',
          folderId: null,
          profileId: 'default',
          createdAt: Date.now(),
          tags: [],
        }
        await fxrk.bookmarks.add(bookmark)
        addToast('Bookmarked!', 'success')
      }
    }
    const handleFullscreen = () => {
      fxrk.window.maximize()
    }
    const handleDevtools = () => {
      if (activeTabId) fxrk.devtools.open(activeTabId)
    }

    document.addEventListener('fxrk:zoomIn', handleZoomIn)
    document.addEventListener('fxrk:zoomOut', handleZoomOut)
    document.addEventListener('fxrk:zoomReset', handleZoomReset)
    document.addEventListener('fxrk:bookmarkPage', handleBookmark)
    document.addEventListener('fxrk:toggleFullscreen', handleFullscreen)

    const unsubDevtools = fxrk.app.onShortcut('devtools', handleDevtools)

    return () => {
      document.removeEventListener('fxrk:zoomIn', handleZoomIn)
      document.removeEventListener('fxrk:zoomOut', handleZoomOut)
      document.removeEventListener('fxrk:zoomReset', handleZoomReset)
      document.removeEventListener('fxrk:bookmarkPage', handleBookmark)
      document.removeEventListener('fxrk:toggleFullscreen', handleFullscreen)
      unsubDevtools()
    }
  }, [activeTabId, activeTab, addToast])

  // ── Handlers for Toolbar ──────────────────────────────────
  const handleBookmark = async () => {
    if (!activeTab?.url || activeTab.url.startsWith('fxrk://')) return
    const existingId = await fxrk.bookmarks.isBookmarked(activeTab.url, 'default') as string | null
    if (existingId) {
      await fxrk.bookmarks.delete(existingId)
      addToast('Bookmark removed', 'info')
    } else {
      const bookmark: Bookmark = {
        id: uuidv4(),
        url: activeTab.url,
        title: activeTab.title || activeTab.url,
        favicon: activeTab.favicon || '',
        folderId: null,
        profileId: 'default',
        createdAt: Date.now(),
        tags: [],
      }
      await fxrk.bookmarks.add(bookmark)
      addToast('Bookmarked! ✓', 'success')
    }
  }

  const handleScreenshot = async () => {
    if (!activeTabId) return
    const dataUrl = await fxrk.screenshot.capture(activeTabId) as string | null
    if (dataUrl) {
      addToast('Screenshot captured', 'success')
      // Could open in new tab or save to file
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      {/* Frameless title bar */}
      <TitleBar />

      {/* Tab bar */}
      <TabBar
        onNewTab={() => openTab()}
        onCloseTab={closeTab}
        onSwitchTab={switchTab}
        onReorderTabs={reorderTabs}
      />

      {/* Toolbar / URL bar */}
      <Toolbar
        onNavigate={navigate}
        onBack={goBack}
        onForward={goForward}
        onRefresh={refresh}
        onStop={stop}
        onHome={goHome}
        onBookmark={handleBookmark}
        onScreenshot={handleScreenshot}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Web content area */}
        <div ref={contentRef} className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
          {/* Tab contents (internal pages render here, BrowserView overlays this for web URLs) */}
          {tabs.map(tab => (
            <div
              key={tab.id}
              className="absolute inset-0"
              style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
            >
              <TabContent
                tab={tab}
                isActive={tab.id === activeTabId}
                onNavigate={navigate}
              />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <Sidebar onNavigate={navigate} />
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Modals / Overlays */}
      <FindInPageModal />
      <CodeNotificationModal />
      <ContextMenu />
      <ToastContainer />
    </div>
  )
}
