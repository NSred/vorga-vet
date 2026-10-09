import * as Dialog from '@radix-ui/react-dialog'
import { PanelFrame, type PanelFrameProps } from '../PanelFrame/PanelFrame'
import styles from './SlidePanel.module.css'

export type SlidePanelProps = PanelFrameProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SlidePanel({ open, onOpenChange, ...frame }: SlidePanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <PanelFrame {...frame} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
