import type { ReactNode } from 'react'
import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  tone?: 'default' | 'danger'
  isPending?: boolean
  onConfirm: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'default',
  isPending = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
      title={title}
      description={description}
      footer={
        <>
          <Button
            variant="outline"
            type="button"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            type="button"
            disabled={isPending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? null}
    </Modal>
  )
}
