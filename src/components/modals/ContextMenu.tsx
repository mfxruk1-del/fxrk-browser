import React, { useEffect, useRef } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useBrowser } from '../../hooks/useBrowser'

// ============================================================
// ContextMenu - Global context menu that appears on right-click
// ============================================================

export function ContextMenu() {
  const { contextMenu, hideContextMenu } = useUIStore()
  const { openTab, closeTab, duplicateTab, activeTabId } = useBrowser()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contextMenu) return
    const handleClick = () => hideContextMenu()
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextMenu, hideContextMenu])

  if (!contextMenu) return null

  const handleAction = async (action: string) => {
    hideContextMenu()

    if (action === 'new-tab') {
      openTab()
    } else if (action.startsWith('close:')) {
      const tabId = action.split(':')[1]
      closeTab(tabId)
    } else if (action.startsWith('duplicate:')) {
      const tabId = action.split(':')[1]
      duplicateTab(tabId)
    } else if (action.startsWith('close-others:')) {
      // Close all other tabs logic
    }
    // Other actions handled by parent components via event bus
  }

  // Adjust position to stay within viewport
  const x = Math.min(contextMenu.x, window.innerWidth - 180)
  const y = Math.min(contextMenu.y, window.innerHeight - contextMenu.items.length * 32 - 16)

  return (
    <div
      ref={menuRef}
      className="context-menu fixed z-50"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {contextMenu.items.map((item, i) => {
        if (item.label === '─────' || item.action === 'separator') {
          return <div key={i} className="context-menu-separator" />
        }
        return (
          <button
            key={i}
            className={`context-menu-item w-full text-left ${item.danger ? 'text-[#ff0040] hover:bg-[rgba(255,0,64,0.05)]' : ''}`}
            onClick={() => handleAction(item.action)}
          >
            {item.icon && <span className="text-[12px] w-4 shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
