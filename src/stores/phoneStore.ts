import { create } from 'zustand'
import type { SMSConversation, SMSMessage, PhoneBridgeStatus, VerificationCodeAlert } from '../../electron/utils/types'

interface PhoneStore {
  status: PhoneBridgeStatus
  conversations: SMSConversation[]
  activeConversationId: string | null
  messages: SMSMessage[]
  pendingAlerts: VerificationCodeAlert[]
  clipboardSyncActive: boolean

  setStatus: (s: PhoneBridgeStatus) => void
  setConversations: (c: SMSConversation[]) => void
  setActiveConversation: (id: string | null) => void
  addMessage: (msg: SMSMessage) => void
  setMessages: (msgs: SMSMessage[]) => void
  addAlert: (alert: VerificationCodeAlert) => void
  dismissAlert: (id: string) => void
  setClipboardSyncActive: (v: boolean) => void
}

export const usePhoneStore = create<PhoneStore>((set) => ({
  status: { connected: false, authenticating: false },
  conversations: [],
  activeConversationId: null,
  messages: [],
  pendingAlerts: [],
  clipboardSyncActive: false,

  setStatus: (status) => set({ status }),
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  addAlert: (alert) => set((state) => ({ pendingAlerts: [...state.pendingAlerts, alert] })),
  dismissAlert: (id) => set((state) => ({ pendingAlerts: state.pendingAlerts.filter(a => a.id !== id) })),
  setClipboardSyncActive: (clipboardSyncActive) => set({ clipboardSyncActive }),
}))
