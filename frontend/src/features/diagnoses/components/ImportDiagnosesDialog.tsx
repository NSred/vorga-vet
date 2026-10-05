import { useEffect, useState } from 'react'
import { Button, Modal, Textarea } from '@/shared/ui'
import { diagnosisErrorMessage } from '../api/diagnosisErrors'
import { useImportDiagnoses } from '../hooks/useDiagnosisMutations'
import { splitPastedNames } from '../lib/diagnosisMapping'
import type { DiagnosisImportResult } from '../types'

export interface ImportDiagnosesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (result: DiagnosisImportResult) => void
}

export function ImportDiagnosesDialog({
  open,
  onOpenChange,
  onImported,
}: ImportDiagnosesDialogProps) {
  const importNames = useImportDiagnoses()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) {
      setText('')
      setError(undefined)
    }
  }, [open])

  const names = splitPastedNames(text)

  const submit = () => {
    setError(undefined)
    if (names.length === 0) {
      setError('Paste at least one diagnosis')
      return
    }
    importNames.mutate(names, {
      onSuccess: onImported,
      onError: (failure) =>
        setError(diagnosisErrorMessage(failure, 'Could not add the diagnoses.')),
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Paste a list of diagnoses"
      description="One diagnosis per line. Names already on the list, retired ones included, are skipped."
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={submit} disabled={importNames.isPending}>
            {names.length > 0 ? `Add ${names.length}` : 'Add'}
          </Button>
        </>
      }
    >
      <Textarea
        id="diagnoses-paste"
        label="Diagnoses"
        placeholder={'Otitis media\nRhinitis acuta\nFractura femoris'}
        rows={10}
        value={text}
        onChange={(event) => setText(event.target.value)}
        error={error}
      />
    </Modal>
  )
}
