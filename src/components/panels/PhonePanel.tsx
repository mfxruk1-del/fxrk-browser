import React, { useState, useEffect, useRef } from 'react'
import { usePhone } from '../../hooks/usePhone'
import { usePhoneStore } from '../../stores/phoneStore'
import { useBrowserStore } from '../../stores/browserStore'

// ============================================================
// PhonePanel - iCloud SMS bridge, send-to-phone, clipboard sync
// ============================================================

export function PhonePanel() {
  const { status, conversations, messages, connect, disconnect, loadConversations, loadMessages, sendMessage, sendLink, sendNote, syncClipboardToPhone, submit2FA } = usePhone()
  const { activeConversationId, pendingAlerts } = usePhoneStore()
  const { tabs, activeTabId } = useBrowserStore()
  const activeTab = tabs.find(t => t.id === activeTabId)

  const [view, setView] = useState<'config' | 'conversations' | 'messages' | 'send'>('config')
  const [appleId, setAppleId] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [composeText, setComposeText] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [showing2FA, setShowing2FA] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Switch to conversations view when connected
  useEffect(() => {
    if (status.connected) {
      setView('conversations')
      loadConversations()
    }
  }, [status.connected, loadConversations])

  // Listen for 2FA requirement
  useEffect(() => {
    const unsub = window.fxrk.phone.on2FARequired(() => setShowing2FA(true))
    return unsub
  }, [])

  const handleConnect = async () => {
    if (!appleId.trim() || !appPassword.trim()) return
    await connect({ appleId, appSpecificPassword: appPassword })
  }

  const handleSendMessage = async () => {
    const conv = conversations.find(c => c.id === activeConversationId)
    if (!conv || !composeText.trim()) return
    await sendMessage(conv.participantNumber, composeText)
    setComposeText('')
  }

  const handle2FASubmit = () => {
    if (twoFACode.length >= 4) {
      submit2FA(twoFACode)
      setShowing2FA(false)
      setTwoFACode('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* Header */}
      <div className="panel-header border-b border-[#1a1a1a]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#bc13fe" strokeWidth="1.5">
          <rect x="2.5" y="0.5" width="7" height="11" rx="1"/>
          <circle cx="6" cy="9.5" r="0.7" fill="#bc13fe"/>
        </svg>
        <span style={{ color: '#bc13fe' }}>PHONE BRIDGE</span>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-[#00ff41]' : status.authenticating ? 'bg-[#ffcc00] animate-pulse' : 'bg-[#333]'}`} />
          <span className="text-[10px] text-[#444]">
            {status.connected ? 'CONNECTED' : status.authenticating ? 'CONNECTING...' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* 2FA Modal */}
      {showing2FA && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#bc13fe] rounded-lg p-6 m-4 w-full max-w-sm">
            <h3 className="text-[#bc13fe] font-bold mb-2">Two-Factor Authentication</h3>
            <p className="text-[#555] text-xs mb-4">Enter the 6-digit code from your Apple device</p>
            <input
              type="text"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="000000"
              className="fxrk-input text-center text-xl tracking-widest mb-4"
              autoFocus
              maxLength={6}
            />
            <div className="flex gap-2">
              <button className="fxrk-btn fxrk-btn-primary flex-1" onClick={handle2FASubmit}>
                Submit
              </button>
              <button className="fxrk-btn fxrk-btn-secondary" onClick={() => setShowing2FA(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!status.connected && !status.authenticating ? (
          // Connection form
          <div className="p-4 flex flex-col gap-3">
            <p className="text-[#555] text-xs leading-relaxed">
              Connect your iPhone via iCloud.com to receive SMS verification codes and sync content.
            </p>
            <div>
              <label className="text-[10px] text-[#444] uppercase tracking-wider block mb-1">Apple ID</label>
              <input
                type="email"
                value={appleId}
                onChange={(e) => setAppleId(e.target.value)}
                placeholder="your@apple.id"
                className="fxrk-input"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#444] uppercase tracking-wider block mb-1">
                App-Specific Password
              </label>
              <input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="fxrk-input"
              />
              <p className="text-[10px] text-[#333] mt-1">
                Generate at appleid.apple.com → Security → App-Specific Passwords
              </p>
            </div>
            {status.error && (
              <div className="text-[#ff0040] text-xs bg-[rgba(255,0,64,0.08)] border border-[rgba(255,0,64,0.2)] rounded p-2">
                {status.error}
              </div>
            )}
            <button
              className="fxrk-btn fxrk-btn-primary"
              onClick={handleConnect}
              disabled={!appleId || !appPassword}
            >
              Connect via iCloud
            </button>
          </div>
        ) : status.authenticating ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="fxrk-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            <span className="text-[#555] text-xs">Connecting to iCloud...</span>
          </div>
        ) : (
          // Connected view
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-[#1a1a1a] shrink-0">
              {(['conversations', 'send'] as const).map(v => (
                <button
                  key={v}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${view === v ? 'text-[#bc13fe] border-b-2 border-[#bc13fe]' : 'text-[#444] hover:text-[#888]'}`}
                  onClick={() => setView(v)}
                >
                  {v === 'conversations' ? 'Messages' : 'Send To Phone'}
                </button>
              ))}
              <button
                className="px-3 py-2 text-[10px] text-[#333] hover:text-[#ff0040] transition-colors"
                onClick={() => { disconnect(); setView('config') }}
                title="Disconnect"
              >
                ✕
              </button>
            </div>

            {view === 'conversations' && (
              <ConversationsView
                conversations={conversations}
                activeId={activeConversationId}
                messages={messages}
                onSelectConversation={loadMessages}
                composeText={composeText}
                onComposeChange={setComposeText}
                onSend={handleSendMessage}
                messagesEndRef={messagesEndRef}
              />
            )}

            {view === 'send' && (
              <SendToPhoneView
                activeTabUrl={activeTab?.url || ''}
                activeTabTitle={activeTab?.title || ''}
                onSendLink={sendLink}
                onSendNote={sendNote}
                onSyncClipboard={syncClipboardToPhone}
              />
            )}
          </div>
        )}
      </div>

      {/* Pending alerts */}
      {pendingAlerts.length > 0 && (
        <div className="border-t border-[rgba(0,255,65,0.1)] p-3 bg-[rgba(0,255,65,0.03)]">
          <div className="text-[10px] text-[#00ff41] uppercase tracking-wider mb-2">🔔 Pending Codes</div>
          {pendingAlerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-2 mb-1">
              <span className="text-[#00ff41] font-bold text-lg font-mono tracking-[4px]">{alert.code}</span>
              <span className="text-[#333] text-[10px] truncate">from {alert.sender}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Conversations View ────────────────────────────────────

function ConversationsView({ conversations, activeId, messages, onSelectConversation, composeText, onComposeChange, onSend, messagesEndRef }: {
  conversations: ReturnType<typeof usePhone>['conversations']
  activeId: string | null
  messages: ReturnType<typeof usePhone>['messages']
  onSelectConversation: (id: string) => void
  composeText: string
  onComposeChange: (text: string) => void
  onSend: () => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Conversation list */}
      <div className="w-1/3 border-r border-[#1a1a1a] overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-[#333] text-xs text-center">No conversations</div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.id}
              className={`w-full flex flex-col gap-0.5 px-3 py-2.5 text-left border-b border-[#111] transition-colors ${activeId === conv.id ? 'bg-[#151515]' : 'hover:bg-[#111]'}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#e0e0e0] font-medium truncate">{conv.participantName || conv.participantNumber}</span>
                {conv.unreadCount > 0 && (
                  <span className="fxrk-badge bg-[#bc13fe] text-white text-[9px] shrink-0">{conv.unreadCount}</span>
                )}
              </div>
              <span className="text-[10px] text-[#444] truncate">{conv.lastMessage}</span>
            </button>
          ))
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeId ? (
          <>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOutgoing ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-[11px] ${
                    msg.isOutgoing
                      ? 'bg-[rgba(188,19,254,0.15)] text-[#e0e0e0] border border-[rgba(188,19,254,0.2)]'
                      : 'bg-[#1a1a1a] text-[#e0e0e0] border border-[#222]'
                  }`}>
                    {msg.text}
                    {msg.hasVerificationCode && (
                      <div className="mt-1 text-[#00ff41] font-bold font-mono tracking-wider">
                        Code: {msg.verificationCode}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Compose */}
            <div className="flex gap-2 p-2 border-t border-[#1a1a1a]">
              <input
                type="text"
                value={composeText}
                onChange={(e) => onComposeChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
                placeholder="iMessage..."
                className="fxrk-input flex-1 text-[11px] py-1.5"
              />
              <button className="fxrk-btn fxrk-btn-primary px-3 text-[11px]" onClick={onSend}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[#333] text-xs">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}

// ── Send To Phone View ────────────────────────────────────

function SendToPhoneView({ activeTabUrl, activeTabTitle, onSendLink, onSendNote, onSyncClipboard }: {
  activeTabUrl: string
  activeTabTitle: string
  onSendLink: (url: string) => void
  onSendNote: (content: string, title?: string) => void
  onSyncClipboard: () => void
}) {
  const [noteContent, setNoteContent] = useState('')

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Send current page */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-3">
        <div className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Current Page</div>
        <p className="text-[11px] text-[#888] truncate mb-3">{activeTabTitle || activeTabUrl || 'No page open'}</p>
        <button
          className="fxrk-btn fxrk-btn-primary w-full text-[11px]"
          onClick={() => activeTabUrl && onSendLink(activeTabUrl)}
          disabled={!activeTabUrl}
        >
          📱 Send Link to iPhone
        </button>
      </div>

      {/* Create note */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-3">
        <div className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Create Note</div>
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Type note content to send to iPhone..."
          className="fxrk-input w-full h-20 resize-none text-[11px]"
        />
        <button
          className="fxrk-btn fxrk-btn-primary w-full text-[11px] mt-2"
          onClick={() => { onSendNote(noteContent); setNoteContent('') }}
          disabled={!noteContent.trim()}
        >
          📝 Send Note to iPhone
        </button>
      </div>

      {/* Clipboard sync */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-3">
        <div className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Clipboard Sync</div>
        <p className="text-[10px] text-[#333] mb-3">
          Sync your clipboard to iPhone via iCloud Notes. On iPhone: create a Note titled "FXRK To PC" to sync back.
        </p>
        <button
          className="fxrk-btn fxrk-btn-secondary w-full text-[11px]"
          onClick={onSyncClipboard}
        >
          📋 Push Clipboard to iPhone
        </button>
      </div>
    </div>
  )
}
