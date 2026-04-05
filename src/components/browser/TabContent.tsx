import React, { useMemo } from 'react'
import { NewTabPage } from './NewTabPage'
import type { Tab } from '../../../electron/utils/types'

interface TabContentProps {
  tab: Tab
  isActive: boolean
  onNavigate: (url: string) => void
}

// ============================================================
// TabContent - Renders the content area for a tab.
// For internal fxrk:// pages it renders React components.
// For web URLs, the actual rendering happens in the BrowserView
// managed by the main process — this component just provides
// the placeholder / overlay area.
// ============================================================

export function TabContent({ tab, isActive, onNavigate }: TabContentProps) {
  const isInternalPage = tab.url?.startsWith('fxrk://') || tab.url === '' || tab.url === 'about:blank'

  if (!isActive) return null

  if (isInternalPage || !tab.url) {
    return (
      <div className="w-full h-full overflow-auto">
        {(!tab.url || tab.url === 'fxrk://newtab' || tab.url === 'about:blank') ? (
          <NewTabPage onNavigate={onNavigate} />
        ) : tab.url === 'fxrk://settings' ? (
          <div className="p-8 text-[#e0e0e0]">
            <h1 className="text-xl font-bold text-[#00ff41] mb-4">Settings</h1>
            <p className="text-[#555]">Open the Settings panel from the toolbar.</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#555]">
            <span className="font-mono text-sm">{tab.url}</span>
          </div>
        )}
      </div>
    )
  }

  // For external URLs, the BrowserView is positioned over this area by the main process.
  // This component renders nothing visible — it just provides the target area.
  // Error pages are shown inline.
  if (tab.errorCode) {
    return <ErrorPage tab={tab} onRetry={() => onNavigate(tab.url)} />
  }

  return null
}

// ── Error Page ─────────────────────────���───────────────────

function ErrorPage({ tab, onRetry }: { tab: Tab; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 bg-[#0a0a0a]">
      <div className="text-6xl">⚠</div>
      <div className="text-center">
        <h2 className="text-[#ff0040] text-lg font-bold mb-2">Page Load Error</h2>
        <p className="text-[#555] text-sm mb-1">{tab.errorDescription || 'Could not load page'}</p>
        <p className="text-[#333] text-xs font-mono">{tab.url}</p>
      </div>
      <div className="flex gap-3">
        <button
          className="fxrk-btn fxrk-btn-primary"
          onClick={onRetry}
        >
          Try Again
        </button>
        <button
          className="fxrk-btn fxrk-btn-secondary"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
