import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { IconButton } from '@/shared/ui/IconButton/IconButton'
import styles from './SlidePanel.module.css'

export type SlidePanelHeaderTone = 'plain' | 'accent'

interface SlidePanelBaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  headerTone?: SlidePanelHeaderTone
  footer?: ReactNode
  children: ReactNode
}

interface TitledSlidePanelProps extends SlidePanelBaseProps {
  title: string
  subtitle?: ReactNode
  badge?: ReactNode
  ariaLabel?: string
  header?: never
}

interface CustomSlidePanelProps extends SlidePanelBaseProps {
  header: ReactNode
  ariaLabel: string
  title?: never
  subtitle?: never
  badge?: never
}

export type SlidePanelProps = TitledSlidePanelProps | CustomSlidePanelProps

export function SlidePanel({
  open,
  onOpenChange,
  headerTone = 'plain',
  footer,
  children,
  ...heading
}: SlidePanelProps) {
  const ariaLabel = heading.ariaLabel ?? heading.title

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <Dialog.Title className={styles.visuallyHidden}>{ariaLabel}</Dialog.Title>
          <div className={`${styles.header} ${styles[`header_${headerTone}`]}`}>
            <div className={styles.headerBody}>
              {heading.title === undefined ? (
                heading.header
              ) : (
                <>
                  <div className={styles.titleRow}>
                    <div className={styles.title}>{heading.title}</div>
                    {heading.badge}
                  </div>
                  {heading.subtitle && <div className={styles.subtitle}>{heading.subtitle}</div>}
                </>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close" variant="filled" className={styles.close}>
                ✕
              </IconButton>
            </Dialog.Close>
          </div>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
