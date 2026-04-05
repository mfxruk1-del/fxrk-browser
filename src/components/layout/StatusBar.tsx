import React from 'react'
import { useBrowserStore } from '../../stores/browserStore'
import { usePrivacyStore } from '../../stores/privacyStore'
import { usePhoneStore } from '../../stores/phoneStore'

// ============================================================
// StatusBar - Bottom status bar showing privacy stats,
// connection info, and current status messages.
// ============================================================

export function StatusBar() {
  const { tabs, activeTabId } = useBrowserStore()
  const { totalBlockedToday, tabBlockedCounts, tabGrades, settings } = usePrivacyStore()
  const { status: phoneStatus } = usePhoneStore()

  const activeTab = tabs.find(t => t.id === activeTabId)
  const blockedOnPage = activeTabId ? (tabBlockedCounts[activeTabId] ?? 0) : 0
  const grade = activeTabId ? tabGrades[activeTabId] : null
  const isHTTPS = activeTab?.url?.startsWith('https://') ?? false

  return (
    <div className="flex items-center h-6 bg-[#080808] border-t border-[#1a1a1a] px-3 gap-4 text-[10px] text-[#444] select-none shrink-0">
      {/* Connection status */}
      <div className="flex items-center gap-1">
        {isHTTPS ? (
          <>
            <span className="text-[#00ff41]">●</span>
            <span className="text-[#555]">HTTPS</span>
          </>
        ) : (
          <>
            <span className="text-[#555]">●</span>
            <span>HTTP</span>
          </>
        )}
      </div>

      {/* Privacy grade */}
      {grade && (
        <div className={`flex items-center gap-1 grade-${grade.grade.toLowerCase()}`}>
          <span>Privacy</span>
          <span className="font-bold">{grade.grade}</span>
        </div>
      )}

      {/* Blocked count for this page */}
      {blockedOnPage > 0 && (
        <div className="flex items-center gap-1 text-[#00ff41]">
          <span>🛡</span>
          <span>{blockedOnPage} blocked</span>
        </div>
      )}

      {/* Total blocked today */}
      <div className="flex items-center gap-1">
        <span className="text-[#333]">Today:</span>
        <span className="text-[#555]">{totalBlockedToday.toLocaleString()} blocked</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Privacy features active */}
      <div className="flex items-center gap-2">
        {settings?.adBlockEnabled && (
          <span className="text-[#333] hover:text-[#555] transition-colors" title="Ad blocking active">AD</span>
        )}
        {settings?.fingerprintSpoof && (
          <span className="text-[#333] hover:text-[#555] transition-colors" title="Fingerprint spoofing active">FP</span>
        )}
        {settings?.httpsOnly && (
          <span className="text-[#333] hover:text-[#555] transition-colors" title="HTTPS-only mode active">SSL</span>
        )}
      </div>

      {/* Phone status */}
      {phoneStatus.connected && (
        <div className="flex items-center gap-1 text-[#bc13fe]">
          <span>📱</span>
          <span>Phone</span>
        </div>
      )}

      {/* Zoom */}
      {activeTab && activeTab.zoomLevel !== 1 && (
        <div className="text-[#555]">
          {Math.round(activeTab.zoomLevel * 100)}%
        </div>
      )}

      {/* Active tab URL on hover */}
      <div className="text-[#333] truncate max-w-xs" title={activeTab?.url || ''}>
        {activeTab?.url && activeTab.url !== 'fxrk://newtab' ? activeTab.url.substring(0, 60) : ''}
      </div>
    </div>
  )
}
