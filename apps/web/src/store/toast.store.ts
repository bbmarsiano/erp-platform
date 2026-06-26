import { create } from 'zustand'

export type ToastVariant = 'default' | 'success' | 'error'

interface ToastState {
  message: string | null
  variant: ToastVariant
  show: (message: string, variant?: ToastVariant) => void
  clear: () => void
}

let hideTimer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'default',
  show: (message, variant = 'default') => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message, variant })
    hideTimer = setTimeout(() => set({ message: null, variant: 'default' }), 4000)
  },
  clear: () => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message: null, variant: 'default' })
  }
}))
