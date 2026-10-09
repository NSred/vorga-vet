import * as Dialog from '@radix-ui/react-dialog'
import { PanelFrame, type PanelFrameProps } from '../PanelFrame/PanelFrame'
import styles from './CenteredPanel.module.css'

export type CenteredPanelSize = 'medium' | 'wide'

export type CenteredPanelProps = PanelFrameProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
  size?: CenteredPanelSize
}

export function CenteredPanel({
  open,
  onOpenChange,
  size = 'medium',
  ...frame
}: CenteredPanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={`${styles.content} ${styles[size]}`}
          aria-describedby={undefined}
        >
          <PanelFrame {...frame} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
