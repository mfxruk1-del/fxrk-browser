import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useBrowserStore } from '../../stores/browserStore'
import { usePrivacyStore } from '../../stores/privacyStore'
import { useUIStore } from '../../stores/uiStore'
import { normalizeInput } from '../../../electron/utils/validators'

const fxrk = window.fxrk

interface ToolbarProps {
  onNavigate: (url: string) => void
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
  onStop: () => void
  onHome: () => void
  onBookmark: () => void
  onScreenshot: () => void
}

// ============================================================
// Toolbar - Navigation bar with URL input and action buttons
// ============================================================

export function Toolbar({
  onNavigate, onBack, onForward, onRefresh, onStop, onHome, onBookmark, onScreenshot
}: ToolbarProps) {
  const { tabs, activeTabId } = useBrowserStore()
  const { tabBlockedCounts } = usePrivacyStore()
  const { toggleSidebar, openSettings } = useUIStore()

  const activeTab = tabs.find(t => t.id === activeTabId)
  const [urlInput, setUrlInput] = useState(activeTab?.url || '')
  const [urlFocused, setUrlFocused] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync URL bar with active tab
  useEffect(() => {
    if (!urlFocused) {
      setUrlInput(activeTab?.url || '')
    }
  }, [activeTab?.url, urlFocused])

  // Focus URL bar event from keyboard shortcut
  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    document.addEventListener('fxrk:focusUrlBar', handler)
    return () => document.removeEventListener('fxrk:focusUrlBar', handler)
  }, [])

  // Check bookmark status
  useEffect(() => {
    if (activeTab?.url) {
      fxrk.bookmarks.isBookmarked(activeTab.url, 'default').then((id: string | null) => {
        setIsBookmarked(!!id)
      })
    }
  }, [activeTab?.url])

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (urlInput.trim()) {
      onNavigate(urlInput.trim())
      inputRef.current?.blur()
    }
  }, [urlInput, onNavigate])

  const handleUrlFocus = useCallback(() => {
    setUrlFocused(true)
    setTimeout(() => inputRef.current?.select(), 10)
  }, [])

  const handleUrlBlur = useCallback(() => {
    setUrlFocused(false)
    if (!urlFocused) {
      setUrlInput(activeTab?.url || '')
    }
  }, [activeTab?.url, urlFocused])

  const blockedCount = activeTabId ? (tabBlockedCounts[activeTabId] ?? 0) : 0
  const isHTTPS = activeTab?.url?.startsWith('https://') ?? false
  const isLoading = activeTab?.isLoading ?? false
  const canGoBack = activeTab?.canGoBack ?? false
  const canGoForward = activeTab?.canGoForward ?? false

  const displayUrl = urlFocused ? urlInput : (activeTab?.url || '')

  return (
    <div className="flex items-center h-[52px] bg-[#0d0d0d] border-b border-[#1a1a1a] px-2 gap-1">
      {/* Navigation buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <NavBtn onClick={onBack} disabled={!canGoBack} title="Back (Alt+←)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavBtn>
        <NavBtn onClick={onForward} disabled={!canGoForward} title="Forward (Alt+→)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavBtn>
        <NavBtn onClick={isLoading ? onStop : onRefresh} title={isLoading ? 'Stop (Escape)' : 'Refresh (Ctrl+R)'}>
          {isLoading ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l8 8M11 3L3 11" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 7a5 5 0 0 1 5-5 5 5 0 0 1 3.5 1.5L12 6" strokeLinecap="round"/>
              <path d="M12 2v4H8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </NavBtn>
        <NavBtn onClick={onHome} title="Home">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 7L7 2l5 5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 7v5h2v-3h2v3h2V7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavBtn>
      </div>

      {/* URL Bar */}
      <form
        className={`
          flex-1 flex items-center gap-2 h-8 px-3 rounded
          border transition-all duration-150
          ${urlFocused
            ? 'bg-[#111] border-[#00ff41] shadow-[0_0_0_2px_rgba(0,255,65,0.1)]'
            : 'bg-[#111] border-[#1e1e1e] hover:border-[#2a2a2a]'
          }
        `}
        onSubmit={handleUrlSubmit}
      >
        {/* Security/Connection indicator */}
        <div className="shrink-0" title={isHTTPS ? 'Secure HTTPS connection' : 'Not secure'}>
          {isHTTPS ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#00ff41" strokeWidth="1.2">
              <rect x="2" y="5" width="8" height="6" rx="1"/>
              <path d="M4 5V3.5a2 2 0 1 1 4 0V5"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#888" strokeWidth="1.2">
              <circle cx="6" cy="6" r="5"/>
              <path d="M4 4.5C4 3.1 4.9 2 6 2s2 1.1 2 2.5v1.5H4V4.5z"/>
              <rect x="2" y="5" width="8" height="5" rx="1"/>
            </svg>
          )}
        </div>

        {/* URL input */}
        <input
          ref={inputRef}
          type="text"
          value={displayUrl}
          onChange={(e) => setUrlInput(e.target.value)}
          onFocus={handleUrlFocus}
          onBlur={handleUrlBlur}
          placeholder="Search or enter URL..."
          className="flex-1 bg-transparent text-[12px] text-[#e0e0e0] placeholder-[#333] outline-none caret-[#00ff41]"
          spellCheck={false}
          autoComplete="off"
        />

        {/* Blocked count badge */}
        {blockedCount > 0 && (
          <div
            className="shrink-0 flex items-center gap-1 px-1.5 rounded text-[10px] bg-[rgba(0,255,65,0.08)] text-[#00ff41] border border-[rgba(0,255,65,0.2)]"
            title={`${blockedCount} ads/trackers blocked on this page`}
          >
            🛡 {blockedCount}
          </div>
        )}
      </form>

      {/* Right action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Bookmark */}
        <NavBtn onClick={onBookmark} title={isBookmarked ? 'Remove bookmark (Ctrl+D)' : 'Bookmark page (Ctrl+D)'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill={isBookmarked ? '#00ff41' : 'none'} stroke={isBookmarked ? '#00ff41' : 'currentColor'} strokeWidth="1.5">
            <path d="M3 2h8v11l-4-3-4 3V2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavBtn>

        {/* Extensions/UA indicator */}
        <NavBtn
          onClick={() => toggleSidebar('settings')}
          title="Privacy/UA Settings"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="2"/>
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.36 9.36l1.42 1.42M9.36 4.64L10.78 3.22M3.22 10.78l1.41-1.42" strokeLinecap="round"/>
          </svg>
        </NavBtn>

        {/* Screenshot */}
        <NavBtn onClick={onScreenshot} title="Screenshot (Ctrl+Shift+S)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="12" height="9" rx="1"/>
            <circle cx="7" cy="7.5" r="2"/>
            <path d="M5 3l1-2h2l1 2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavBtn>

        {/* Phone panel */}
        <NavBtn
          onClick={() => toggleSidebar('phone')}
          title="Phone Integration (Ctrl+Shift+P)"
          glow
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="1" width="8" height="12" rx="1.5"/>
            <circle cx="7" cy="11" r="0.8" fill="currentColor"/>
          </svg>
        </NavBtn>

        {/* Settings */}
        <NavBtn onClick={openSettings} title="Settings (Ctrl+,)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="2"/>
            <path d="M7 1.5v1.2M7 11.3v1.2M1.5 7h1.2M11.3 7h1.2M3.28 3.28l.85.85M9.87 9.87l.85.85M10.72 3.28l-.85.85M4.13 9.87l-.85.85" strokeLinecap="round"/>
          </svg>
        </NavBtn>
      </div>
    </div>
  )
}

// ── Small nav button ──────────────────────────────────────

interface NavBtnProps {
  onClick: () => void
  disabled?: boolean
  title?: string
  glow?: boolean
  children: React.ReactNode
}

function NavBtn({ onClick, disabled, title, glow, children }: NavBtnProps) {
  return (
    <button
      className={`
        flex items-center justify-center w-8 h-8 rounded
        transition-all duration-100
        ${disabled
          ? 'text-[#2a2a2a] cursor-not-allowed'
          : glow
            ? 'text-[#bc13fe] hover:text-[#bc13fe] hover:bg-[rgba(188,19,254,0.1)]'
            : 'text-[#555] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
        }
      `}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}
