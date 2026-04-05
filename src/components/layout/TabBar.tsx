import React, { useRef, useState, useCallback } from 'react'
import { useBrowserStore } from '../../stores/browserStore'
import { useUIStore } from '../../stores/uiStore'
import type { Tab } from '../../../electron/utils/types'

interface TabBarProps {
  onNewTab: () => void
  onCloseTab: (id: string) => void
  onSwitchTab: (id: string) => void
  onReorderTabs: (from: number, to: number) => void
}

// ============================================================
// TabBar - Draggable tab strip with pinned tabs support
// ============================================================

export function TabBar({ onNewTab, onCloseTab, onSwitchTab, onReorderTabs }: TabBarProps) {
  const { tabs, activeTabId } = useBrowserStore()
  const { showContextMenu } = useUIStore()
  const dragRef = useRef<{ tabId: string; startX: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const handleDragStart = useCallback((e: React.MouseEvent, tabId: string) => {
    dragRef.current = { tabId, startX: e.clientX }
    setDraggingId(tabId)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragRef.current = null
    setDraggingId(null)
  }, [])

  const handleTabContextMenu = useCallback((e: React.MouseEvent, tab: Tab) => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New Tab', action: 'new-tab', icon: '＋' },
      { label: 'Duplicate Tab', action: `duplicate:${tab.id}`, icon: '⧉' },
      { label: 'Pin Tab', action: `pin:${tab.id}`, icon: '📌' },
      { label: 'Mute Tab', action: `mute:${tab.id}`, icon: '🔇' },
      { label: '─────', action: 'separator' },
      { label: 'Close Tab', action: `close:${tab.id}`, icon: '✕', danger: true },
      { label: 'Close Other Tabs', action: `close-others:${tab.id}`, icon: '✕', danger: true },
    ])
  }, [showContextMenu])

  const pinnedTabs = tabs.filter(t => t.isPinned)
  const normalTabs = tabs.filter(t => !t.isPinned)

  return (
    <div className="flex items-end h-9 bg-[#090909] border-b border-[#1a1a1a] overflow-hidden">
      {/* Pinned tabs (compact) */}
      {pinnedTabs.map(tab => (
        <PinnedTab
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onClick={() => onSwitchTab(tab.id)}
          onClose={() => onCloseTab(tab.id)}
          onContextMenu={(e) => handleTabContextMenu(e, tab)}
        />
      ))}

      {/* Separator if both pinned and normal tabs exist */}
      {pinnedTabs.length > 0 && normalTabs.length > 0 && (
        <div className="w-px h-5 bg-[#1e1e1e] mx-1 self-center shrink-0" />
      )}

      {/* Scrollable normal tabs */}
      <div className="flex-1 flex items-end overflow-x-auto overflow-y-hidden scrollbar-none min-w-0 gap-px">
        {normalTabs.map((tab, idx) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            isDragging={draggingId === tab.id}
            onClick={() => onSwitchTab(tab.id)}
            onClose={(e) => { e.stopPropagation(); onCloseTab(tab.id) }}
            onContextMenu={(e) => handleTabContextMenu(e, tab)}
            onMouseDown={(e) => handleDragStart(e, tab.id)}
            onMouseUp={handleDragEnd}
          />
        ))}
      </div>

      {/* New Tab button */}
      <button
        className="flex items-center justify-center w-9 h-8 mb-0.5 shrink-0 text-[#444] hover:text-[#00ff41] hover:bg-[#1a1a1a] rounded transition-colors mr-1"
        onClick={onNewTab}
        title="New Tab (Ctrl+T)"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 1v10M1 6h10"/>
        </svg>
      </button>
    </div>
  )
}

// ── Individual Tab Item ────────────────────────────────────

interface TabItemProps {
  tab: Tab
  isActive: boolean
  isDragging: boolean
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseUp: () => void
}

function TabItem({ tab, isActive, isDragging, onClick, onClose, onContextMenu, onMouseDown, onMouseUp }: TabItemProps) {
  const containerColor = tab.containerId ? getContainerColor(tab.containerId) : null

  return (
    <div
      className={`
        group relative flex items-center gap-1.5 h-8 px-3 min-w-0 max-w-[200px] rounded-t cursor-pointer
        border border-transparent transition-all duration-100 shrink-0
        ${isActive
          ? 'bg-[#111] border-[#1e1e1e] border-b-[#111] text-[#e0e0e0]'
          : 'bg-transparent text-[#555] hover:text-[#888] hover:bg-[#0d0d0d]'
        }
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {/* Container color indicator */}
      {containerColor && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
          style={{ background: containerColor }}
        />
      )}

      {/* Favicon or spinner */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {tab.isLoading ? (
          <div className="fxrk-spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
        ) : tab.favicon ? (
          <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.5">
            <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1"/>
            <circle cx="6" cy="6" r="2"/>
          </svg>
        )}
      </div>

      {/* Title */}
      <span className="flex-1 text-[11px] truncate leading-none">
        {tab.title || tab.url || 'New Tab'}
      </span>

      {/* Close button */}
      <button
        className={`
          flex items-center justify-center w-4 h-4 rounded
          text-[#444] hover:text-[#ff0040] hover:bg-[rgba(255,0,64,0.1)]
          transition-all shrink-0
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        onClick={onClose}
        title="Close Tab"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1L7 7M7 1L1 7"/>
        </svg>
      </button>
    </div>
  )
}

// ── Pinned Tab (compact square) ────────────────────────────

interface PinnedTabProps {
  tab: Tab
  isActive: boolean
  onClick: () => void
  onClose: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function PinnedTab({ tab, isActive, onClick, onContextMenu }: PinnedTabProps) {
  return (
    <div
      className={`
        flex items-center justify-center w-9 h-8 rounded-t cursor-pointer border border-transparent
        transition-all duration-100 shrink-0
        ${isActive
          ? 'bg-[#111] border-[#1e1e1e] border-b-[#111] text-[#e0e0e0]'
          : 'bg-transparent text-[#555] hover:text-[#888] hover:bg-[#0d0d0d]'
        }
      `}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={tab.title}
    >
      {tab.isLoading ? (
        <div className="fxrk-spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
      ) : tab.favicon ? (
        <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm" />
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.5">
          <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1"/>
        </svg>
      )}
    </div>
  )
}

function getContainerColor(containerId: string): string {
  const colors: Record<string, string> = {
    personal: '#0088ff',
    work: '#00cc44',
    shopping: '#ff8800',
    banking: '#ff2244',
  }
  return colors[containerId] || '#bc13fe'
}
