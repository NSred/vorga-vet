import type { ReactNode } from 'react'
import { clinicDateOf, clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { Badge, Button, EmptyState, Skeleton, useToast } from '@/shared/ui'
import { useCompleteReminder, useMarkContacted } from '../hooks/useVaccinationMutations'
import { useDueItems } from '../hooks/useVaccinationQueries'
import { DUE_WINDOW_LABELS, inWindow, untilFor } from '../lib/dueWindows'
import { relativeDue } from '../lib/relativeDue'
import type { DueItem, DueWindow } from '../types'
import styles from './DueList.module.css'

export interface DueListProps {
  dueWindow: DueWindow
  renderPatient: (patientId: string) => ReactNode
}

const EMPTY: Record<DueWindow, string> = {
  overdue: 'Nothing is overdue.',
  week: 'Nothing is due in the next 7 days.',
  month: 'Nothing is due in the next 30 days.',
  year: 'Nothing is due in the next 12 months.',
}

export function DueList({ dueWindow, renderPatient }: DueListProps) {
  const { showToast } = useToast()
  const today = clinicToday()
  const { data, isPending, isError } = useDueItems(untilFor(dueWindow, today))
  const contacted = useMarkContacted()
  const done = useCompleteReminder()

  if (isPending) return <Skeleton height="8rem" />
  if (isError) return <p className={styles.muted}>Could not load what is due.</p>

  const items = (data ?? []).filter((item) => inWindow(item, dueWindow, today))
  if (items.length === 0) return <EmptyState message={EMPTY[dueWindow]} />

  const action = (item: DueItem) => {
    if (item.kind === 'reminder') {
      return (
        <Button
          variant="outline"
          type="button"
          disabled={done.isPending}
          onClick={() =>
            done.mutate(item.id, {
              onSuccess: () => showToast({ tone: 'success', title: 'Reminder done' }),
              onError: () => showToast({ tone: 'error', title: 'Could not mark it done' }),
            })
          }
        >
          Mark done
        </Button>
      )
    }
    if (item.contactedAt) {
      return <Badge tone="ok">Contacted {formatDisplayDate(clinicDateOf(item.contactedAt))}</Badge>
    }
    return (
      <Button
        variant="outline"
        type="button"
        disabled={contacted.isPending}
        onClick={() =>
          contacted.mutate(item.id, {
            onError: () => showToast({ tone: 'error', title: 'Could not mark it contacted' }),
          })
        }
      >
        Mark contacted
      </Button>
    )
  }

  return (
    <ul className={styles.list} aria-label={DUE_WINDOW_LABELS[dueWindow]}>
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className={styles.row}>
          <div className={styles.what}>
            <div className={styles.meta}>
              <Badge tone={item.kind === 'vaccination' ? 'ok' : 'warn'}>
                {item.kind === 'vaccination' ? 'Vaccination' : 'Reminder'}
              </Badge>
              <span className={item.dueOn < today ? styles.overdue : styles.when}>
                {relativeDue(item.dueOn, today)} · {formatDisplayDate(item.dueOn)}
              </span>
            </div>
            <span className={styles.title}>{item.title}</span>
          </div>
          <div className={styles.patient}>{renderPatient(item.patientId)}</div>
          <div className={styles.action}>{action(item)}</div>
        </li>
      ))}
    </ul>
  )
}
