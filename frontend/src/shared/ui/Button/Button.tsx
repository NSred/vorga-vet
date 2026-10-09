import { useRef, type ButtonHTMLAttributes } from 'react'
import { useShortcut } from '@/shared/lib/useShortcut'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'soft'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  shortcut?: string
}

export function Button({
  variant = 'primary',
  className,
  shortcut,
  children,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  useShortcut(shortcut, () => ref.current?.click(), !rest.disabled)

  return (
    <button
      ref={ref}
      className={`${styles.button} ${styles[variant]} ${className ?? ''}`}
      aria-keyshortcuts={shortcut?.toUpperCase()}
      {...rest}
    >
      {children}
      {shortcut && (
        <kbd className={styles.shortcut} aria-hidden="true">
          {shortcut.toUpperCase()}
        </kbd>
      )}
    </button>
  )
}
