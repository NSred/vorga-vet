import { useState, type ReactNode } from 'react'
import { clinicToday } from '@/shared/lib/clinicTime'
import { Skeleton } from '@/shared/ui'
import { ChargesEditor } from '../components/ChargesEditor'
import { chargesError, chargesTotal, fromDraft, initialDrafts, isDraftValid } from '../lib/charges'
import type { ChargeDraft, ChargeLine } from '../types'
import { useExaminationChargesQuery, useSaveExaminationCharges } from './useExaminationChargesQuery'

export interface ExaminationChargesOptions {
  open: boolean
  examinationId?: string
  earlierCost?: number
  givenOn?: string
}

export interface ExaminationCharges {
  section: ReactNode
  total?: number
  validate: () => boolean
  commit: (examinationId: string) => Promise<ChargeLine[]>
}

export function useExaminationCharges({
  open,
  examinationId,
  earlierCost,
  givenOn,
}: ExaminationChargesOptions): ExaminationCharges {
  const query = useExaminationChargesQuery(open ? examinationId : undefined)
  const save = useSaveExaminationCharges()
  const [drafts, setDrafts] = useState<ChargeDraft[] | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const session = open ? (examinationId ?? 'new') : null
  const [sessionFor, setSessionFor] = useState<string | null>(null)
  if (session !== sessionFor) {
    setSessionFor(session)
    setDrafts(null)
    setShowErrors(false)
  }

  const loaded = !examinationId || query.isSuccess || query.isError
  if (session !== null && session === sessionFor && drafts === null && loaded) {
    setDrafts(initialDrafts(query.data ?? [], earlierCost))
  }

  const section =
    drafts === null ? (
      <Skeleton height="6rem" />
    ) : (
      <ChargesEditor
        drafts={drafts}
        onChange={setDrafts}
        showErrors={showErrors}
        givenOn={givenOn ?? clinicToday()}
      />
    )

  return {
    section,
    total: drafts && drafts.length > 0 ? chargesTotal(drafts) : undefined,
    validate: () => {
      setShowErrors(true)
      return drafts !== null && drafts.every(isDraftValid) && chargesError(drafts) === undefined
    },
    commit: async (savedExaminationId: string) => {
      if (drafts === null) return []
      const lines = drafts.map((draft, index) =>
        fromDraft(draft, `${savedExaminationId}-${index + 1}`),
      )
      await save.mutateAsync({ examinationId: savedExaminationId, lines })
      return lines
    },
  }
}
