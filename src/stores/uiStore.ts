import { create } from 'zustand'

type SidebarPanel = 'phone' | 'bookmarks' | 'history' | 'downloads' | 'notes' | 'settings' | 'auth' | 'containers' | null

interface UIStore {
  sidebarOpen: boolean
  activePanel: SidebarPanel
  settingsOpen: boolean
  findOpen: boolean
  codeAlertVisible: boolean
  codeAlertData: {
    code: string
    sender: string
    message: string
  } | null
  contextMenu: {
    x: number
    y: number
    items: Array<{ label: string; action: string; icon?: string; danger?: boolean }>
  } | null
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number }>
  isMaximized: boolean
  oauthModal: { provider: string; config: Record<string, unknown> } | null
  confirmDialog: {
    title: string
    message: string
    onConfirm: () => void
    onCancel?: () => void
    danger?: boolean
  } | null

  // Actions
  toggleSidebar: (panel?: SidebarPanel) => void
  setSidebarPanel: (panel: SidebarPanel) => void
  openSettings: () => void
  closeSettings: () => void
  setFindOpen: (v: boolean) => void
  showCodeAlert: (data: { code: string; sender: string; message: string }) => void
  hideCodeAlert: () => void
  showContextMenu: (x: number, y: number, items: UIStore['contextMenu']['items']) => void
  hideContextMenu: () => void
  addToast: (message: string, type?: UIStore['toasts'][0]['type'], duration?: number) => void
  removeToast: (id: string) => void
  setIsMaximized: (v: boolean) => void
  openOAuthModal: (provider: string, config: Record<string, unknown>) => void
  closeOAuthModal: () => void
  showConfirm: (opts: Omit<UIStore['confirmDialog'], never>) => void
  hideConfirm: () => void
}

let toastIdCounter = 0

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: false,
  activePanel: null,
  settingsOpen: false,
  findOpen: false,
  codeAlertVisible: false,
  codeAlertData: null,
  contextMenu: null,
  toasts: [],
  isMaximized: false,
  oauthModal: null,
  confirmDialog: null,

  toggleSidebar: (panel) => {
    const { sidebarOpen, activePanel } = get()
    if (panel !== undefined) {
      if (sidebarOpen && activePanel === panel) {
        set({ sidebarOpen: false, activePanel: null })
      } else {
        set({ sidebarOpen: true, activePanel: panel })
      }
    } else {
      set({ sidebarOpen: !sidebarOpen })
    }
  },

  setSidebarPanel: (panel) => set({ activePanel: panel }),

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  setFindOpen: (v) => set({ findOpen: v }),

  showCodeAlert: (data) => set({ codeAlertVisible: true, codeAlertData: data }),
  hideCodeAlert: () => set({ codeAlertVisible: false, codeAlertData: null }),

  showContextMenu: (x, y, items) => set({ contextMenu: { x, y, items } }),
  hideContextMenu: () => set({ contextMenu: null }),

  addToast: (message, type = 'info', duration = 4000) => {
    const id = String(++toastIdCounter)
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }))

    if (duration && duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setIsMaximized: (isMaximized) => set({ isMaximized }),

  openOAuthModal: (provider, config) => set({ oauthModal: { provider, config } }),
  closeOAuthModal: () => set({ oauthModal: null }),

  showConfirm: (opts) => set({ confirmDialog: opts }),
  hideConfirm: () => set({ confirmDialog: null }),
}))
