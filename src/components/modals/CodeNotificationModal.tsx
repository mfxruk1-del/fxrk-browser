import React, { useEffect, useState } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { usePhoneStore } from '../../stores/phoneStore'

// ============================================================
// CodeNotificationModal - Large, prominent SMS code alert
// Cannot be missed. Auto-dismisses after 2 minutes.
// ============================================================

export function CodeNotificationModal() {
  const { codeAlertVisible, codeAlertData, hideCodeAlert } = useUIStore()
  const { dismissAlert, pendingAlerts } = usePhoneStore()
  const [countdown, setCountdown] = useState(120)
  const [copied, setCopied] = useState(false)

  // Auto-dismiss countdown
  useEffect(() => {
    if (!codeAlertVisible) {
      setCountdown(120)
      setCopied(false)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          hideCodeAlert()
          return 120
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [codeAlertVisible, hideCodeAlert])

  const handleCopy = () => {
    if (codeAlertData?.code) {
      navigator.clipboard.writeText(codeAlertData.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDismiss = () => {
    hideCodeAlert()
    // Dismiss the latest pending alert too
    if (pendingAlerts.length > 0) {
      dismissAlert(pendingAlerts[pendingAlerts.length - 1].id)
    }
  }

  if (!codeAlertVisible || !codeAlertData) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 pointer-events-none"
    >
      <div
        className="pointer-events-auto animate-notification-in"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a, #111)',
          border: '2px solid #00ff41',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '340px',
          maxWidth: '420px',
          boxShadow: '0 0 0 1px rgba(0,255,65,0.2), 0 0 40px rgba(0,255,65,0.2), 0 8px 40px rgba(0,0,0,0.9)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,65,0.1)', border: '1.5px solid rgba(0,255,65,0.3)' }}>
            <span className="text-xl">📱</span>
          </div>
          <div>
            <div className="text-[#00ff41] font-bold text-sm">Verification Code Detected!</div>
            <div className="text-[#555] text-xs">From: {codeAlertData.sender}</div>
          </div>
          <button
            className="ml-auto text-[#333] hover:text-[#ff0040] transition-colors p-1"
            onClick={handleDismiss}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1L11 11M11 1L1 11"/>
            </svg>
          </button>
        </div>

        {/* The Code — BIG and prominent */}
        <div
          className="text-center py-4 my-2 rounded-lg relative overflow-hidden cursor-pointer"
          style={{
            background: 'rgba(0,255,65,0.05)',
            border: '1px solid rgba(0,255,65,0.2)',
          }}
          onClick={handleCopy}
          title="Click to copy"
        >
          <div
            className="font-mono font-black tracking-[12px] select-all"
            style={{
              fontSize: '42px',
              lineHeight: 1,
              color: '#00ff41',
              textShadow: '0 0 20px rgba(0,255,65,0.6), 0 0 40px rgba(0,255,65,0.2)',
            }}
          >
            {codeAlertData.code}
          </div>
          <div className="text-[10px] text-[#333] mt-2 tracking-wider">
            {copied ? '✓ COPIED TO CLIPBOARD' : 'CLICK TO COPY'}
          </div>
        </div>

        {/* Message preview */}
        <div className="text-[10px] text-[#333] mt-3 bg-[#0d0d0d] rounded p-2 border border-[#111] line-clamp-2">
          {codeAlertData.message}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            className="fxrk-btn fxrk-btn-primary flex-1"
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
          <button
            className="fxrk-btn fxrk-btn-secondary"
            onClick={handleDismiss}
          >
            Dismiss
          </button>
        </div>

        {/* Countdown */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-[#1a1a1a] rounded overflow-hidden">
            <div
              className="h-full bg-[#00ff41] transition-all duration-1000"
              style={{ width: `${(countdown / 120) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-[#333]">Closes in {countdown}s</span>
        </div>
      </div>
    </div>
  )
}
