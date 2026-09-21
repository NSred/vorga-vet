import { useRef, useState } from 'react'
import { Button, Modal, Select } from '@/shared/ui'
import { examinationErrorMessage } from '../api/examinationErrors'
import { useUploadAttachment } from '../hooks/useExaminationMutations'
import {
  ACCEPTED_ATTACHMENT_TYPES,
  attachmentFileError,
  formatFileSize,
} from '../lib/attachmentRules'
import type { AttachmentKind } from '../types'
import styles from './AttachmentUploader.module.css'

export interface AttachmentUploaderProps {
  examinationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: () => void
}

const KIND_OPTIONS = [
  { value: 'xray', label: 'X-ray' },
  { value: 'ultrasound', label: 'Ultrasound' },
]

export function AttachmentUploader({
  examinationId,
  open,
  onOpenChange,
  onUploaded,
}: AttachmentUploaderProps) {
  const upload = useUploadAttachment()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [kind, setKind] = useState<AttachmentKind>('xray')
  const [error, setError] = useState<string | undefined>(undefined)

  const reset = () => {
    setFile(null)
    setKind('xray')
    setError(undefined)
    if (inputRef.current) inputRef.current.value = ''
  }

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const pick = (picked: File | undefined) => {
    setError(undefined)

    if (!picked) {
      setFile(null)
      return
    }

    const rejection = attachmentFileError(picked)
    if (rejection) {
      setFile(null)
      setError(rejection)
      return
    }

    setFile(picked)
  }

  const submit = () => {
    if (!file) {
      setError('Choose an image first.')
      return
    }

    upload.mutate(
      { examinationId, file, kind },
      {
        onSuccess: () => {
          reset()
          onUploaded()
        },
        onError: (failure) =>
          setError(examinationErrorMessage(failure, 'Could not upload that image.')),
      },
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Add an image"
      description="Attach an X-ray or ultrasound image to this visit."
      footer={
        <>
          <Button variant="outline" type="button" disabled={upload.isPending} onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" type="button" disabled={upload.isPending} onClick={submit}>
            Upload
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <div className={styles.field}>
          <label htmlFor="attachment-file" className={styles.label}>
            Image
          </label>
          <input
            id="attachment-file"
            ref={inputRef}
            type="file"
            accept={ACCEPTED_ATTACHMENT_TYPES.join(',')}
            onChange={(event) => pick(event.target.files?.[0])}
          />
          {file && (
            <span className={styles.picked}>
              {file.name} · {formatFileSize(file.size)}
            </span>
          )}
        </div>

        <Select
          id="attachment-kind"
          label="Kind"
          value={kind}
          onChange={(next) => setKind(next as AttachmentKind)}
          options={KIND_OPTIONS}
        />

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
