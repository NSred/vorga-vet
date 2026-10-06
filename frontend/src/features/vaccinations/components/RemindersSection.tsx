import { useState } from 'react'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import {
  Badge,
  Button,
  EmptyState,
  layout,
  RecordItem,
  RecordList,
  Skeleton,
  useToast,
} from '@/shared/ui'
import { useCompleteReminder } from '../hooks/useVaccinationMutations'
import { usePatientReminders } from '../hooks/useVaccinationQueries'
import { AddReminderDialog } from './AddReminderDialog'
import styles from './PatientSections.module.css'

export interface RemindersSectionProps {
  patientId: string
}

export function RemindersSection({ patientId }: RemindersSectionProps) {
  const { showToast } = useToast()
  const { data, isPending, isError } = usePatientReminders(patientId)
  const complete = useCompleteReminder()
  const [adding, setAdding] = useState(false)

  return (
    <div className={layout.stackTight}>
      {isPending && <Skeleton height="3rem" />}
      {isError && <p className={styles.muted}>Could not load the reminders.</p>}
      {data && data.length === 0 && <EmptyState message="No reminders." />}

      {data && data.length > 0 && (
        <RecordList label="Reminders">
          {data.map((reminder) => (
            <RecordItem
              key={reminder.id}
              faded={Boolean(reminder.doneAt)}
              title={reminder.reason}
              meta={formatDisplayDate(reminder.date)}
              actions={
                reminder.doneAt ? (
                  <Badge tone="ok">Done</Badge>
                ) : (
                  <Button
                    variant="outline"
                    type="button"
                    disabled={complete.isPending}
                    onClick={() =>
                      complete.mutate(reminder.id, {
                        onError: () =>
                          showToast({ tone: 'error', title: 'Could not mark the reminder done' }),
                      })
                    }
                  >
                    Mark done
                  </Button>
                )
              }
            />
          ))}
        </RecordList>
      )}

      <div>
        <Button variant="outline" type="button" onClick={() => setAdding(true)}>
          ＋ Reminder
        </Button>
      </div>

      <AddReminderDialog
        patientId={patientId}
        open={adding}
        onOpenChange={setAdding}
        onAdded={() => {
          setAdding(false)
          showToast({ tone: 'success', title: 'Reminder added' })
        }}
      />
    </div>
  )
}
