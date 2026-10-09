import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { oneOf } from '@/shared/lib/listParams'
import { Button, layout, PageHeader, SegmentedControl, useToast } from '@/shared/ui'
import { PatientContact, PatientPicker, type PatientListItem } from '@/features/patients'
import {
  AddReminderDialog,
  DUE_WINDOW_LABELS,
  DueList,
  type DueWindow,
} from '@/features/vaccinations'

const WINDOWS: DueWindow[] = ['overdue', 'week', 'month', 'year']
const WINDOW_OPTIONS = WINDOWS.map((value) => ({ value, label: DUE_WINDOW_LABELS[value] }))
const DEFAULT_WINDOW: DueWindow = 'week'

export function RemindersPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const dueWindow = oneOf(searchParams.get('window'), WINDOWS) ?? DEFAULT_WINDOW
  const [adding, setAdding] = useState(false)
  const [patient, setPatient] = useState<PatientListItem | null>(null)

  return (
    <div className={layout.page}>
      <PageHeader
        title="Reminders"
        subtitle="Vaccinations coming due and reminders to follow up, with the owner's phone."
        actions={
          <Button
            variant="primary"
            type="button"
            shortcut="n"
            onClick={() => {
              setPatient(null)
              setAdding(true)
            }}
          >
            ＋ Reminder
          </Button>
        }
      />

      <SegmentedControl
        value={dueWindow}
        onChange={(next) =>
          setSearchParams(next === DEFAULT_WINDOW ? {} : { window: next }, { replace: true })
        }
        options={WINDOW_OPTIONS}
      />

      <DueList
        dueWindow={dueWindow}
        renderPatient={(patientId) => <PatientContact patientId={patientId} />}
      />

      <AddReminderDialog
        patientId={patient?.id ?? null}
        open={adding}
        onOpenChange={setAdding}
        patientField={(error) => (
          <PatientPicker value={patient} onChange={setPatient} error={error} />
        )}
        onAdded={() => {
          setAdding(false)
          showToast({ tone: 'success', title: 'Reminder added' })
        }}
      />
    </div>
  )
}
