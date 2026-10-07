import type { ButtonHTMLAttributes } from 'react'
import styles from './IconButton.module.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'plain' | 'filled'
}

export function IconButton({ label, className, variant = 'plain', ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`${styles.iconButton} ${variant === 'filled' ? styles.filled : ''} ${className ?? ''}`}
      {...rest}
    />
  )
}
