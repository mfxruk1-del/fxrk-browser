import { useEffect, useCallback } from 'react'
import { usePrivacyStore } from '../stores/privacyStore'
import { useBrowserStore } from '../stores/browserStore'
import type { PrivacySettings } from '../../electron/utils/types'

const fxrk = window.fxrk

export function usePrivacy() {
  const {
    settings, tabGrades, tabBlockedCounts, totalBlockedToday,
    setSettings, updateSettings, setTabGrade, setTabBlockedCount, setTotalBlockedToday,
    getActiveGrade,
  } = usePrivacyStore()

  const { activeTabId } = useBrowserStore()

  // Load settings on mount
  useEffect(() => {
    fxrk.privacy.getSettings().then((s) => {
      if (s) setSettings(s as PrivacySettings)
    })
    fxrk.privacy.getBlockedCount().then((n) => {
      setTotalBlockedToday(n as number)
    })
  }, [setSettings, setTotalBlockedToday])

  // Periodically update blocked count for active tab
  useEffect(() => {
    if (!activeTabId) return
    const update = async () => {
      const count = await fxrk.privacy.getBlockedForTab(activeTabId) as number
      setTabBlockedCount(activeTabId, count)

      const tab = document.title // can't get tab URL here, use stored
      const grade = await fxrk.privacy.getGrade('', count, true)
      setTabGrade(activeTabId, grade as Parameters<typeof setTabGrade>[1])
    }
    update()
    const timer = setInterval(update, 3000)
    return () => clearInterval(timer)
  }, [activeTabId, setTabBlockedCount, setTabGrade])

  const updatePrivacySetting = useCallback(async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    updateSettings({ [key]: value })
    await fxrk.privacy.setSettings({ [key]: value })
  }, [updateSettings])

  const toggleSiteAdBlocking = useCallback(async (domain: string, enabled: boolean) => {
    await fxrk.privacy.toggleSite(domain, enabled)
  }, [])

  const clearCookies = useCallback(async (partition?: string) => {
    await fxrk.privacy.clearCookies(partition)
  }, [])

  const activeTabBlockedCount = activeTabId ? (tabBlockedCounts[activeTabId] ?? 0) : 0
  const activeGrade = getActiveGrade(activeTabId)

  return {
    settings,
    tabGrades,
    totalBlockedToday,
    activeTabBlockedCount,
    activeGrade,
    updatePrivacySetting,
    toggleSiteAdBlocking,
    clearCookies,
  }
}
