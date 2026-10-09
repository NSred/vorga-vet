import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { IconButton } from '@/shared/ui/IconButton/IconButton'
import styles from './PanelFrame.module.css'

export type PanelHeaderTone = 'plain' | 'accent'

interface PanelBaseProps {
  headerTone?: PanelHeaderTone
  headerTint?: string
  footer?: ReactNode
  children: ReactNode
}

interface TitledPanelProps extends PanelBaseProps {
  title: string
  subtitle?: ReactNode
  badge?: ReactNode
  ariaLabel?: string
  header?: never
}

interface CustomPanelProps extends PanelBaseProps {
  header: ReactNode
  ariaLabel: string
  title?: never
  subtitle?: never
  badge?: never
}

export type PanelFrameProps = TitledPanelProps | CustomPanelProps

export function PanelFrame({
  headerTone = 'plain',
  headerTint,
  footer,
  children,
  ...heading
}: PanelFrameProps) {
  const ariaLabel = heading.ariaLabel ?? heading.title

  return (
    <>
      <Dialog.Title className={styles.visuallyHidden}>{ariaLabel}</Dialog.Title>
      <div
        className={`${styles.header} ${styles[`header_${headerTone}`]}`}
        style={headerTint ? { background: headerTint } : undefined}
      >
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
    </>
  )
}
