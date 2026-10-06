import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'
import styles from './FormDialog.module.css'

export interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  formId: string
  submitLabel: string
  isPending?: boolean
  secondaryAction?: { label: string; onClick: () => void }
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  onOpen?: () => void
  children: ReactNode
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  formId,
  submitLabel,
  isPending = false,
  secondaryAction,
  onSubmit,
  onOpen,
  children,
}: FormDialogProps) {
  const onOpenRef = useRef(onOpen)

  useEffect(() => {
    onOpenRef.current = onOpen
  }, [onOpen])

  useEffect(() => {
    if (open) onOpenRef.current?.()
  }, [open])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {secondaryAction && (
            <Button variant="secondary" type="button" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          <Button variant="primary" type="submit" form={formId} disabled={isPending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.stopPropagation()
          void onSubmit(event)
        }}
      >
        {children}
      </form>
    </Modal>
  )
}
