import { createContext } from 'react'

export type ToastTone = 'success' | 'error'

export interface ToastRequest {
  tone: ToastTone
  title: string
  description?: string
}

export interface ToastContextValue {
  showToast: (toast: ToastRequest) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
