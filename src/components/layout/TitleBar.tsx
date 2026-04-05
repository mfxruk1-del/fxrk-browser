import React, { useEffect, useState } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useBrowserStore } from '../../stores/browserStore'

const fxrk = window.fxrk

// ============================================================
// TitleBar - Custom frameless window title bar
// Includes drag region, FXRK logo, active tab title,
// and min/max/close window controls.
// ============================================================

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const { activeTabId, tabs } = useBrowserStore()
  const activeTab = tabs.find(t => t.id === activeTabId)

  useEffect(() => {
    fxrk.window.isMaximized().then((v: boolean) => setIsMaximized(v))
    const unsub = fxrk.window.onMaximized((v: boolean) => setIsMaximized(v))
    return unsub
  }, [])

  return (
    <div
      className="drag-region flex items-center h-9 bg-[#080808] border-b border-[#1a1a1a] select-none"
      style={{ minHeight: '36px' }}
    >
      {/* Logo */}
      <div className="no-drag flex items-center px-3 gap-2 shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect width="16" height="16" rx="3" fill="#00ff41" fillOpacity="0.1"/>
          <path d="M3 4h4v2H5v1h2v2H5v3H3V4z" fill="#00ff41"/>
          <path d="M8 4h5v2h-3v1h2v1h-2v1h3v3h-2v-2h-3v-2h1V6H8V4z" fill="#bc13fe"/>
        </svg>
        <span className="text-[11px] font-bold tracking-[3px] text-[#00ff41]" style={{ textShadow: '0 0 6px rgba(0,255,65,0.5)' }}>
          FXRK
        </span>
      </div>

      {/* Tab title in center */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <span className="text-[11px] text-[#555] truncate max-w-xs">
          {activeTab?.title || 'FXRK Browser'}
        </span>
      </div>

      {/* Window controls - no-drag */}
      <div className="no-drag flex items-center h-full shrink-0">
        {/* Minimize */}
        <button
          className="flex items-center justify-center w-11 h-full text-[#555] hover:text-[#e0e0e0] hover:bg-[#1a1a1a] transition-colors"
          onClick={() => fxrk.window.minimize()}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1"/>
          </svg>
        </button>

        {/* Maximize/Restore */}
        <button
          className="flex items-center justify-center w-11 h-full text-[#555] hover:text-[#e0e0e0] hover:bg-[#1a1a1a] transition-colors"
          onClick={() => fxrk.window.maximize()}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="0" width="8" height="8"/>
              <path d="M0 2v8h8"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0" y="0" width="10" height="10"/>
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          className="flex items-center justify-center w-11 h-full text-[#555] hover:text-[#ff0040] hover:bg-[rgba(255,0,64,0.1)] transition-colors"
          onClick={() => fxrk.window.close()}
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1L9 9M9 1L1 9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
