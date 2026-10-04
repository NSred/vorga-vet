import * as RadixToast from '@radix-ui/react-toast'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastRequest } from './ToastContext'
import styles from './Toast.module.css'

interface ActiveToast extends ToastRequest {
  id: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([])

  const showToast = useCallback((toast: ToastRequest) => {
    setToasts((previous) => [...previous, { ...toast, id: crypto.randomUUID() }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            className={`${styles.toast} ${styles[toast.tone]}`}
            onOpenChange={(open) => {
              if (!open) dismiss(toast.id)
            }}
          >
            <RadixToast.Title className={styles.title}>{toast.title}</RadixToast.Title>
            {toast.description && (
              <RadixToast.Description className={styles.description}>
                {toast.description}
              </RadixToast.Description>
            )}
            <RadixToast.Close className={styles.close} aria-label="Close">
              ×
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className={styles.viewport} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
