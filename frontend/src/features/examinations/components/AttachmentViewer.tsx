import { Modal, Skeleton } from '@/shared/ui'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'
import { attachmentKindLabel, formatFileSize } from '../lib/attachmentRules'
import type { Attachment } from '../types'
import styles from './AttachmentViewer.module.css'

export interface AttachmentViewerProps {
  attachment: Attachment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttachmentViewer({ attachment, open, onOpenChange }: AttachmentViewerProps) {
  const { url, isPending, isError } = useAttachmentUrl(open ? attachment.id : null)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={attachment.fileName}
      description={`${attachmentKindLabel(attachment.kind)} · ${formatFileSize(attachment.sizeBytes)}`}
    >
      <div className={styles.frame}>
        {isPending && <Skeleton height="16rem" />}
        {isError && <p className={styles.error}>This image could not be loaded.</p>}
        {url && <img src={url} alt={attachment.fileName} className={styles.image} />}
      </div>
    </Modal>
  )
}
