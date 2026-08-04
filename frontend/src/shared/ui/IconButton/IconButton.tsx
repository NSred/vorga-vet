import type { ButtonHTMLAttributes } from 'react'
import styles from './IconButton.module.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function IconButton({ label, className, ...rest }: IconButtonProps) {
  return (
    <button aria-label={label} className={`${styles.iconButton} ${className ?? ''}`} {...rest} />
  )
}
