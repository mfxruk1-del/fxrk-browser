import React, { Suspense, lazy } from 'react'
import { useUIStore } from '../../stores/uiStore'

const PhonePanel = lazy(() => import('./PhonePanel').then(m => ({ default: m.PhonePanel })))
const BookmarksPanel = lazy(() => import('./BookmarksPanel').then(m => ({ default: m.BookmarksPanel })))
const HistoryPanel = lazy(() => import('./HistoryPanel').then(m => ({ default: m.HistoryPanel })))
const DownloadsPanel = lazy(() => import('./DownloadsPanel').then(m => ({ default: m.DownloadsPanel })))
const SettingsPanel = lazy(() => import('./SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const AuthPanel = lazy(() => import('./AuthPanel').then(m => ({ default: m.AuthPanel })))
const NotesPanel = lazy(() => import('./NotesPanel').then(m => ({ default: m.NotesPanel })))

type Panel = 'phone' | 'bookmarks' | 'history' | 'downloads' | 'notes' | 'settings' | 'auth' | 'containers' | null

// ============================================================
// Sidebar - Sliding panel container with icon navigation strip
// ============================================================

interface SidebarProps {
  onNavigate: (url: string) => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { sidebarOpen, activePanel, toggleSidebar } = useUIStore()

  const sidebarIcons: Array<{ panel: Panel; icon: React.ReactNode; label: string }> = [
    {
      panel: 'phone',
      label: 'Phone',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3.5" y="0.5" width="9" height="15" rx="1.5"/>
          <circle cx="8" cy="13.5" r="0.8" fill="currentColor"/>
        </svg>
      )
    },
    {
      panel: 'bookmarks',
      label: 'Bookmarks',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 2h8v13l-4-3-4 3V2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      panel: 'history',
      label: 'History',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6"/>
          <path d="M8 4v4l3 2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      panel: 'downloads',
      label: 'Downloads',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2v9M5 8l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 13h12" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      panel: 'notes',
      label: 'Notes',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" rx="1"/>
          <path d="M5 6h6M5 9h4" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      panel: 'auth',
      label: 'Accounts',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="6" r="3"/>
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      panel: 'settings',
      label: 'Settings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="2.5"/>
          <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.7 3.7l1.4 1.4M10.9 10.9l1.4 1.4M10.9 5.1l1.4-1.4M3.7 12.3l1.4-1.4" strokeLinecap="round"/>
        </svg>
      )
    },
  ]

  return (
    <div className="flex h-full animate-slide-in-right">
      {/* Panel content */}
      {sidebarOpen && activePanel && (
        <div
          className="w-80 h-full flex flex-col bg-[#0d0d0d] border-l border-[#1a1a1a] overflow-hidden relative"
          style={{ boxShadow: '-4px 0 20px rgba(0,0,0,0.5)' }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="fxrk-spinner" />
            </div>
          }>
            {activePanel === 'phone' && <PhonePanel />}
            {activePanel === 'bookmarks' && <BookmarksPanel onNavigate={onNavigate} />}
            {activePanel === 'history' && <HistoryPanel onNavigate={onNavigate} />}
            {activePanel === 'downloads' && <DownloadsPanel />}
            {activePanel === 'notes' && <NotesPanel />}
            {activePanel === 'auth' && <AuthPanel />}
            {activePanel === 'settings' && <SettingsPanel />}
          </Suspense>
        </div>
      )}

      {/* Icon strip */}
      <div className="flex flex-col items-center py-2 gap-0.5 bg-[#090909] border-l border-[#1a1a1a] w-10">
        {sidebarIcons.map(({ panel, icon, label }) => (
          <button
            key={panel}
            className={`
              flex items-center justify-center w-8 h-8 rounded transition-all duration-100
              ${activePanel === panel && sidebarOpen
                ? 'bg-[rgba(0,255,65,0.1)] text-[#00ff41]'
                : 'text-[#333] hover:text-[#888] hover:bg-[#111]'
              }
            `}
            onClick={() => toggleSidebar(panel)}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
