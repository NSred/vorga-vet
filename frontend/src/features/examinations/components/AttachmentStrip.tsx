import { useState } from 'react'
import { Button, ConfirmDialog, Skeleton, useToast } from '@/shared/ui'
import { examinationErrorMessage } from '../api/examinationErrors'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'
import { useDeleteAttachment } from '../hooks/useExaminationMutations'
import { attachmentKindLabel } from '../lib/attachmentRules'
import type { Attachment } from '../types'
import { AttachmentUploader } from './AttachmentUploader'
import { AttachmentViewer } from './AttachmentViewer'
import styles from './AttachmentStrip.module.css'

export interface AttachmentStripProps {
  examinationId: string
  attachments: Attachment[]
}

function Thumbnail({
  attachment,
  onOpen,
  onDelete,
}: {
  attachment: Attachment
  onOpen: () => void
  onDelete: () => void
}) {
  const { url, isPending, isError } = useAttachmentUrl(attachment.id)

  return (
    <div className={styles.thumb}>
      <button
        type="button"
        className={styles.preview}
        onClick={onOpen}
        aria-label={`Open ${attachment.fileName}`}
      >
        {isPending && <Skeleton height="4rem" />}
        {isError && <span className={styles.broken}>Image unavailable</span>}
        {url && <img src={url} alt={attachment.fileName} className={styles.image} />}
      </button>
      <div className={styles.meta}>
        <span className={styles.kind}>{attachmentKindLabel(attachment.kind)}</span>
        <button
          type="button"
          className={styles.remove}
          onClick={onDelete}
          aria-label={`Delete ${attachment.fileName}`}
        >
          ✕
        </button>
      </div>
      <span className={styles.fileName}>{attachment.fileName}</span>
    </div>
  )
}

export function AttachmentStrip({ examinationId, attachments }: AttachmentStripProps) {
  const { showToast } = useToast()
  const remove = useDeleteAttachment()
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const [viewing, setViewing] = useState<Attachment | null>(null)
  const [deleting, setDeleting] = useState<Attachment | null>(null)

  const confirmDelete = () => {
    if (!deleting) return

    remove.mutate(
      { examinationId, attachmentId: deleting.id },
      {
        onSuccess: () => {
          setDeleting(null)
          showToast({ tone: 'success', title: 'Image removed' })
        },
        onError: (error) => {
          setDeleting(null)
          showToast({
            tone: 'error',
            title: examinationErrorMessage(error, 'Could not remove that image.'),
          })
        },
      },
    )
  }

  return (
    <div className={styles.strip}>
      <div className={styles.thumbs}>
        {attachments.map((attachment) => (
          <Thumbnail
            key={attachment.id}
            attachment={attachment}
            onOpen={() => setViewing(attachment)}
            onDelete={() => setDeleting(attachment)}
          />
        ))}
        <Button variant="outline" type="button" onClick={() => setUploaderOpen(true)}>
          ＋ Add image
        </Button>
      </div>

      <AttachmentUploader
        examinationId={examinationId}
        open={uploaderOpen}
        onOpenChange={setUploaderOpen}
        onUploaded={() => {
          setUploaderOpen(false)
          showToast({ tone: 'success', title: 'Image added' })
        }}
      />

      {viewing && (
        <AttachmentViewer
          attachment={viewing}
          open
          onOpenChange={(open) => !open && setViewing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove this image?"
        description={deleting ? `${deleting.fileName} will be deleted.` : ''}
        confirmLabel="Remove"
        tone="danger"
        isPending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
