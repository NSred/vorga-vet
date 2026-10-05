import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PrintPortalProps {
  children: ReactNode
  onPrinted: () => void
}

export function PrintPortal({ children, onPrinted }: PrintPortalProps) {
  const onPrintedRef = useRef(onPrinted)

  useEffect(() => {
    onPrintedRef.current = onPrinted
  }, [onPrinted])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.print()
      onPrintedRef.current()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return createPortal(<div className="print-root">{children}</div>, document.body)
}
