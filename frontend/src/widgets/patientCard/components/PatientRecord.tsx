import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { ConfirmDialog, useToast } from '@/shared/ui'
import { useAuth } from '@/features/auth'
import { DiagnosisPicker } from '@/features/diagnoses'
import { ExaminationEditPanel, type Examination } from '@/features/examinations'
import {
  patientErrors,
  patientKeys,
  PatientFormPanel,
  useDeletePatient,
  usePatientQuery,
  type PatientDetail,
} from '@/features/patients'
import { useVisitCharges } from '@/widgets/visit'
import { PatientCardPanel } from './PatientCardPanel'

export interface PatientRecordProps {
  patientId: string | null
  onClose: () => void
}

type Mode = 'view' | 'edit'

export function PatientRecord({ patientId, onClose }: PatientRecordProps) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const isVeterinarian = user?.role === 'veterinarian'
  const queryClient = useQueryClient()
  const remove = useDeletePatient()
  const query = usePatientQuery(patientId ?? '', patientId !== null)

  const [shown, setShown] = useState<PatientDetail | null>(null)
  const [openedFor, setOpenedFor] = useState<string | null>(patientId)
  const [mode, setMode] = useState<Mode>('view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingVisit, setEditingVisit] = useState<Examination | null>(null)
  const visitCharges = useVisitCharges({
    open: editingVisit !== null,
    examination: editingVisit ?? undefined,
  })

  if (openedFor !== patientId) {
    setOpenedFor(patientId)
    if (patientId !== null) {
      setMode('view')
      setConfirmDelete(false)
      setEditingVisit(null)
    }
  }

  const loaded = patientId !== null && query.data?.id === patientId ? query.data : null
  if (loaded && loaded !== shown) {
    setShown(loaded)
  }

  const failed = patientId !== null && query.isError
  useEffect(() => {
    if (!failed) return
    void queryClient.invalidateQueries({ queryKey: patientKeys.all })
    onClose()
  }, [failed, queryClient, onClose])

  const finish = (title: string) => {
    onClose()
    showToast({ tone: 'success', title })
  }

  const handleDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => {
        setConfirmDelete(false)
        finish('Patient deleted')
      },
      onError: (error) => {
        setConfirmDelete(false)
        if (isApiErrorCode(error, patientErrors.notFound, patientErrors.alreadyDeleted)) {
          finish('Patient deleted')
          return
        }
        showToast({ tone: 'error', title: 'Could not delete that patient' })
      },
    })
  }

  if (!shown) return null

  const isOpen = loaded !== null

  return (
    <>
      <PatientCardPanel
        patient={shown}
        open={isOpen && mode === 'view'}
        onOpenChange={(open) => !open && onClose()}
        onEdit={() => setMode('edit')}
        onDelete={() => setConfirmDelete(true)}
        onEditVisit={setEditingVisit}
      />

      {isVeterinarian && mode === 'edit' && (
        <PatientFormPanel
          key={shown.id}
          mode="edit"
          patient={shown}
          open={isOpen}
          onOpenChange={(open) => !open && onClose()}
          onSaved={(patientName) => finish(`${patientName} was saved`)}
          onMissing={() => finish('That patient no longer exists')}
        />
      )}

      <ConfirmDialog
        open={isOpen && confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(false)}
        title="Delete this record?"
        description="The patient will be removed from the active list."
        confirmLabel="Delete"
        tone="danger"
        isPending={remove.isPending}
        onConfirm={() => handleDelete(shown.id)}
      />

      {isOpen && editingVisit && (
        <ExaminationEditPanel
          examination={editingVisit}
          costSlot={visitCharges}
          renderDiagnosis={(field) => <DiagnosisPicker {...field} />}
          open
          onOpenChange={(open) => !open && setEditingVisit(null)}
          onSaved={() => {
            setEditingVisit(null)
            showToast({ tone: 'success', title: 'Visit saved' })
          }}
          onMissing={(message) => {
            setEditingVisit(null)
            showToast({ tone: 'error', title: message })
          }}
        />
      )}
    </>
  )
}
