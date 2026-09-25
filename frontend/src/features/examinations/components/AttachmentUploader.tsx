import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
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
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!file) {
      setPreview(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const reset = () => {
    setFile(null)
    setKind('xray')
    setError(undefined)
    setDragging(false)
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

  const clear = () => {
    setFile(null)
    setError(undefined)
    if (inputRef.current) inputRef.current.value = ''
  }

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    pick(event.dataTransfer.files?.[0])
  }

  const dragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setDragging(false)
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
          <div
            className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${file ? styles.filled : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={dragLeave}
            onDrop={drop}
          >
            <input
              id="attachment-file"
              ref={inputRef}
              type="file"
              className={styles.input}
              accept={ACCEPTED_ATTACHMENT_TYPES.join(',')}
              onChange={(event) => pick(event.target.files?.[0])}
            />
            {file ? (
              <span className={styles.picked}>
                {preview && <img src={preview} alt="" className={styles.thumb} />}
                <span className={styles.pickedMeta}>
                  {file.name} · {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  className={styles.clear}
                  onClick={(event) => {
                    event.stopPropagation()
                    clear()
                  }}
                >
                  Remove
                </button>
              </span>
            ) : (
              <span className={styles.prompt}>
                <svg
                  className={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 15V3" />
                  <path d="m7 8 5-5 5 5" />
                  <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
                <span className={styles.promptText}>Drop an image here, or add</span>
                <span className={styles.formats}>JPG, PNG, WEBP</span>
              </span>
            )}
          </div>
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
