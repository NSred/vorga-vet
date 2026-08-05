import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { IconButton } from '@/shared/ui/IconButton/IconButton'
import styles from './SlidePanel.module.css'

export type SlidePanelHeaderTone = 'plain' | 'accent' | 'warn'

export interface SlidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ariaLabel: string
  headerTone?: SlidePanelHeaderTone
  header: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function SlidePanel({
  open,
  onOpenChange,
  ariaLabel,
  headerTone = 'plain',
  header,
  footer,
  children,
}: SlidePanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <Dialog.Title className={styles.visuallyHidden}>{ariaLabel}</Dialog.Title>
          <div className={`${styles.header} ${styles[`header_${headerTone}`]}`}>
            <div className={styles.headerBody}>{header}</div>
            <Dialog.Close asChild>
              <IconButton label="Close">✕</IconButton>
            </Dialog.Close>
          </div>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
