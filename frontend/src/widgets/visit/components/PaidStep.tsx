import { useState } from 'react'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { formatPrice } from '@/shared/lib/money'
import { Badge, Button, DetailSection, Field, FieldGrid, FormError, layout } from '@/shared/ui'
import {
  examinationErrorMessage,
  examinationErrors,
  usePayExamination,
} from '@/features/examinations'

export interface PaidStepProps {
  examinationId: string
  cost?: number
  onPaid: () => void
}

type PaidState = 'unpaid' | 'paid' | 'already_paid'

export function PaidStep({ examinationId, cost, onPaid }: PaidStepProps) {
  const pay = usePayExamination()
  const [state, setState] = useState<PaidState>('unpaid')
  const [error, setError] = useState<string | undefined>(undefined)

  const markPaid = () => {
    setError(undefined)
    pay.mutate(examinationId, {
      onSuccess: () => {
        setState('paid')
        onPaid()
      },
      onError: (failure) => {
        if (isApiErrorCode(failure, examinationErrors.alreadyPaid)) {
          setState('already_paid')
          return
        }
        setError(examinationErrorMessage(failure, 'Could not mark the examination as paid.'))
      },
    })
  }

  return (
    <div className={layout.page}>
      <DetailSection>
        <FieldGrid>
          <Field label="Status" value={<Badge tone="ok">Recorded</Badge>} />
          <Field label="Cost" value={cost === undefined ? undefined : formatPrice(cost)} />
        </FieldGrid>
      </DetailSection>

      {cost !== undefined && state === 'unpaid' && (
        <Button variant="primary" type="button" disabled={pay.isPending} onClick={markPaid}>
          Mark as paid
        </Button>
      )}
      {state === 'paid' && <p className={layout.note}>Marked as paid.</p>}
      {state === 'already_paid' && <p className={layout.note}>Already marked as paid.</p>}
      {cost === undefined && (
        <p className={layout.note}>No cost was entered, so there is nothing to mark as paid.</p>
      )}
      <FormError message={error} />
    </div>
  )
}
