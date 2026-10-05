import { useEffect, useState } from 'react'
import { Button, Modal, TextField } from '@/shared/ui'
import { jmbgError } from '../lib/jmbg'

export interface JmbgPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (jmbg: string) => void
}

export function JmbgPrompt({ open, onOpenChange, onConfirm }: JmbgPromptProps) {
  const [jmbg, setJmbg] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setJmbg('')
    setError(undefined)
  }, [open])

  const confirm = () => {
    const found = jmbgError(jmbg)
    setError(found)
    if (!found) onConfirm(jmbg.trim())
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Print registration sheet"
      description="The owner’s JMBG is printed but never saved, so it is asked for every time."
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={confirm}>
            Print
          </Button>
        </>
      }
    >
      <TextField
        id="reprint-jmbg"
        label="Owner’s JMBG *"
        inputMode="numeric"
        autoComplete="off"
        value={jmbg}
        onChange={(event) => setJmbg(event.target.value)}
        error={error}
      />
    </Modal>
  )
}
