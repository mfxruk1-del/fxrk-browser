import { useEffect, useCallback } from 'react'
import { usePhoneStore } from '../stores/phoneStore'
import { useUIStore } from '../stores/uiStore'
import type { PhoneBridgeConfig, VerificationCodeAlert } from '../../electron/utils/types'

const fxrk = window.fxrk

export function usePhone() {
  const {
    status, conversations, activeConversationId, messages, pendingAlerts,
    setStatus, setConversations, setActiveConversation, addMessage, setMessages, addAlert, dismissAlert,
  } = usePhoneStore()

  const { showCodeAlert, addToast } = useUIStore()

  useEffect(() => {
    const unsubStatus = fxrk.phone.onStatusChange((s) => {
      setStatus(s as Parameters<typeof setStatus>[0])
    })

    const unsubMessage = fxrk.phone.onNewMessage((msg) => {
      addMessage(msg as Parameters<typeof addMessage>[0])
    })

    const unsubConversations = fxrk.phone.onConversationsUpdated((convs) => {
      setConversations(convs as Parameters<typeof setConversations>[0])
    })

    const unsubCode = fxrk.phone.onCodeDetected((alert) => {
      const a = alert as VerificationCodeAlert
      addAlert(a)
      showCodeAlert({ code: a.code, sender: a.sender, message: a.messageText })
      // Auto-copy to clipboard
      fxrk.clipboard.write(a.code)
      addToast(`Verification code ${a.code} copied to clipboard!`, 'success', 10000)
    })

    const unsub2FA = fxrk.phone.on2FARequired(() => {
      addToast('Apple ID 2FA required — check the phone panel', 'info')
    })

    return () => {
      unsubStatus()
      unsubMessage()
      unsubConversations()
      unsubCode()
      unsub2FA()
    }
  }, [setStatus, addMessage, setConversations, addAlert, showCodeAlert, addToast])

  const connect = useCallback(async (config: PhoneBridgeConfig) => {
    try {
      await fxrk.phone.connect(config as Record<string, unknown>)
    } catch (err) {
      addToast(`Phone connection failed: ${err}`, 'error')
    }
  }, [addToast])

  const disconnect = useCallback(async () => {
    await fxrk.phone.disconnect()
  }, [])

  const loadConversations = useCallback(async () => {
    const convs = await fxrk.phone.getConversations()
    setConversations(convs as Parameters<typeof setConversations>[0])
  }, [setConversations])

  const loadMessages = useCallback(async (convId: string) => {
    setActiveConversation(convId)
    const msgs = await fxrk.phone.getMessages(convId)
    setMessages(msgs as Parameters<typeof setMessages>[0])
  }, [setActiveConversation, setMessages])

  const sendMessage = useCallback(async (to: string, text: string) => {
    try {
      await fxrk.phone.sendMessage(to, text)
    } catch (err) {
      addToast(`Failed to send: ${err}`, 'error')
    }
  }, [addToast])

  const sendLink = useCallback(async (url: string) => {
    try {
      await fxrk.phone.sendLink(url)
      addToast('Link sent to phone via iCloud!', 'success')
    } catch (err) {
      addToast(`Failed to send link: ${err}`, 'error')
    }
  }, [addToast])

  const sendNote = useCallback(async (content: string, title?: string) => {
    try {
      await fxrk.phone.sendNote(content, title)
      addToast('Note sent to phone!', 'success')
    } catch (err) {
      addToast(`Failed to send note: ${err}`, 'error')
    }
  }, [addToast])

  const syncClipboardToPhone = useCallback(async () => {
    try {
      await fxrk.phone.syncClipboard('toPhone')
      addToast('Clipboard synced to phone!', 'success')
    } catch (err) {
      addToast(`Clipboard sync failed: ${err}`, 'error')
    }
  }, [addToast])

  const submit2FA = useCallback((code: string) => {
    fxrk.phone.submit2FA(code)
  }, [])

  return {
    status,
    conversations,
    activeConversationId,
    messages,
    pendingAlerts,
    connect,
    disconnect,
    loadConversations,
    loadMessages,
    sendMessage,
    sendLink,
    sendNote,
    syncClipboardToPhone,
    submit2FA,
    dismissAlert,
  }
}
