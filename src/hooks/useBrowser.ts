import { useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useBrowserStore } from '../stores/browserStore'
import { useUIStore } from '../stores/uiStore'
import type { Tab } from '../../electron/utils/types'

const fxrk = window.fxrk

// ============================================================
// useBrowser - Main hook for tab management and navigation
// ============================================================

export function useBrowser() {
  const {
    tabs, activeTabId, findQuery, findVisible,
    addTab, updateTab, removeTab, setActiveTab,
    setFindQuery, setFindVisible, reorderTabs,
  } = useBrowserStore()

  const { addToast } = useUIStore()

  // ── Listen for tab updates from main process ─────────────
  useEffect(() => {
    const unsubscribe = fxrk.tabs.onUpdate((update) => {
      if (update.id && typeof update.id === 'string') {
        updateTab(update.id, update as Partial<Tab>)
      }
    })
    return unsubscribe
  }, [updateTab])

  // ── Listen for "open new tab" events from main ────────────
  useEffect(() => {
    const unsubscribe = fxrk.app.onOpenNewTab((url) => {
      openTab(url)
    })
    return unsubscribe
  }, [])

  // ── Tab operations ────────────────────────────────────────

  const openTab = useCallback(async (
    url?: string,
    opts?: { containerId?: string | null; background?: boolean }
  ) => {
    try {
      const tab = await fxrk.tabs.create({ url, ...opts })
      addTab(tab as Tab)
      if (!opts?.background) {
        setActiveTab(tab.id)
      }
      return tab as Tab
    } catch (err) {
      addToast(`Failed to open tab: ${err}`, 'error')
      return null
    }
  }, [addTab, setActiveTab, addToast])

  const closeTab = useCallback(async (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId)
    await fxrk.tabs.close(tabId)
    removeTab(tabId)

    // If closing active tab, switch to adjacent tab
    if (tabId === activeTabId) {
      const remainingTabs = tabs.filter(t => t.id !== tabId)
      if (remainingTabs.length > 0) {
        // Try to switch to adjacent tab (prefer right, then left)
        const newActiveTab = remainingTabs[tabIndex] || remainingTabs[tabIndex - 1] || remainingTabs[0]
        await switchTab(newActiveTab.id)
      } else {
        // No tabs left — open a new tab
        await openTab()
      }
    }
  }, [tabs, activeTabId, removeTab, addToast])

  const switchTab = useCallback(async (tabId: string) => {
    await fxrk.tabs.switch(tabId)
    setActiveTab(tabId)
  }, [setActiveTab])

  const navigate = useCallback(async (url: string) => {
    if (!activeTabId) return
    await fxrk.navigate.to(activeTabId, url)
  }, [activeTabId])

  const goBack = useCallback(() => {
    if (activeTabId) fxrk.navigate.back(activeTabId)
  }, [activeTabId])

  const goForward = useCallback(() => {
    if (activeTabId) fxrk.navigate.forward(activeTabId)
  }, [activeTabId])

  const refresh = useCallback(() => {
    if (activeTabId) fxrk.navigate.refresh(activeTabId)
  }, [activeTabId])

  const stop = useCallback(() => {
    if (activeTabId) fxrk.navigate.stop(activeTabId)
  }, [activeTabId])

  const goHome = useCallback(() => {
    if (activeTabId) fxrk.navigate.home(activeTabId)
  }, [activeTabId])

  const reopenClosedTab = useCallback(async () => {
    const closed = await fxrk.session.popClosedTab('default')
    if (closed) {
      await openTab(closed.url as string)
    }
  }, [openTab])

  const duplicateTab = useCallback(async (tabId: string) => {
    const result = await fxrk.tabs.duplicate(tabId) as { url: string } | null
    if (result) {
      await openTab(result.url)
    }
  }, [openTab])

  // ── Find in page ──────────────────────────────────────────

  const findInPage = useCallback((query: string, forward = true) => {
    if (!activeTabId || !query) return
    fxrk.find.search(activeTabId, query, { forward })
  }, [activeTabId])

  const stopFind = useCallback(() => {
    if (activeTabId) fxrk.find.stop(activeTabId)
    setFindVisible(false)
  }, [activeTabId, setFindVisible])

  // ── Active tab ────────────────────────────────────────────

  const activeTab = tabs.find(t => t.id === activeTabId)

  return {
    tabs,
    activeTabId,
    activeTab,
    findQuery,
    findVisible,
    openTab,
    closeTab,
    switchTab,
    navigate,
    goBack,
    goForward,
    refresh,
    stop,
    goHome,
    reopenClosedTab,
    duplicateTab,
    reorderTabs,
    findInPage,
    stopFind,
    setFindQuery,
    setFindVisible,
  }
}
