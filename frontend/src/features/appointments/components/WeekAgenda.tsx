import { Skeleton } from '@/shared/ui'
import {
  addClinicDays,
  clinicDateOf,
  clinicToday,
  clinicWeekRange,
  MONDAY_FIRST_WEEKDAYS,
} from '@/shared/lib/clinicTime'
import { groupByClinicDate, openDates } from '../lib/calendarDays'
import type { Appointment, AvailabilitySlot } from '../types'
import { AgendaRow } from './AgendaRow'
import styles from './WeekAgenda.module.css'

export interface WeekAgendaProps {
  date: string
  appointments: Appointment[]
  slots: AvailabilitySlot[]
  onAppointmentClick: (appointment: Appointment) => void
  isLoading?: boolean
  hasSlotData: boolean
}

export function WeekAgenda({
  date,
  appointments,
  slots,
  onAppointmentClick,
  isLoading,
  hasSlotData,
}: WeekAgendaProps) {
  if (isLoading) {
    return <Skeleton height="20rem" />
  }

  const weekStart = clinicDateOf(clinicWeekRange(date).from)
  const days = Array.from({ length: 7 }, (_, index) => addClinicDays(weekStart, index))
  const byDate = groupByClinicDate(appointments)
  const open = openDates(slots)
  const today = clinicToday()

  return (
    <div className={styles.agenda}>
      {days.map((day, index) => {
        const items = [...(byDate.get(day) ?? [])].sort((a, b) =>
          a.startsAt.localeCompare(b.startsAt),
        )
        const isToday = day === today
        return (
          <section
            key={day}
            className={styles.day}
            aria-label={`${MONDAY_FIRST_WEEKDAYS[index]} ${Number(day.slice(8))}`}
          >
            <div className={styles.heading}>
              <span className={`${styles.label} ${isToday ? styles.labelToday : ''}`}>
                {MONDAY_FIRST_WEEKDAYS[index]} {Number(day.slice(8))}
              </span>
              {isToday && <span className={styles.todayTag}>Today</span>}
              <span className={styles.rule} />
              {items.length > 0 && <span className={styles.count}>{items.length}</span>}
            </div>
            {items.length === 0 ? (
              <p className={styles.empty}>
                {hasSlotData && !open.has(day) ? 'Closed' : 'No appointments'}
              </p>
            ) : (
              <div className={styles.rows}>
                {items.map((appointment) => (
                  <AgendaRow
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => onAppointmentClick(appointment)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
