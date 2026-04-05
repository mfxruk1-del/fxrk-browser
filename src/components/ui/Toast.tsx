import React from 'react'
import { useUIStore } from '../../stores/uiStore'

// ============================================================
// Toast Notifications - Stack of auto-dismissing toasts
// ============================================================

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-8 right-4 z-40 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-slide-in-up flex items-start gap-3 px-4 py-3 rounded-lg max-w-sm"
          style={{
            background: '#111',
            border: `1px solid ${getBorderColor(toast.type)}`,
            boxShadow: `0 0 12px ${getGlowColor(toast.type)}, 0 4px 20px rgba(0,0,0,0.8)`,
            minWidth: '280px',
          }}
        >
          <span className="text-lg shrink-0 mt-0.5">{getIcon(toast.type)}</span>
          <span className="flex-1 text-[12px] text-[#e0e0e0] leading-relaxed">{toast.message}</span>
          <button
            className="text-[#333] hover:text-[#888] transition-colors p-0.5 shrink-0"
            onClick={() => removeToast(toast.id)}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1L9 9M9 1L1 9"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

function getBorderColor(type: string): string {
  switch (type) {
    case 'success': return 'rgba(0,255,65,0.3)'
    case 'error': return 'rgba(255,0,64,0.3)'
    case 'warning': return 'rgba(255,204,0,0.3)'
    default: return 'rgba(0,217,255,0.3)'
  }
}

function getGlowColor(type: string): string {
  switch (type) {
    case 'success': return 'rgba(0,255,65,0.1)'
    case 'error': return 'rgba(255,0,64,0.1)'
    case 'warning': return 'rgba(255,204,0,0.1)'
    default: return 'rgba(0,217,255,0.1)'
  }
}

function getIcon(type: string): string {
  switch (type) {
    case 'success': return '✓'
    case 'error': return '✕'
    case 'warning': return '⚠'
    default: return 'ℹ'
  }
}
