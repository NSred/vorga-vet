import { Skeleton } from '@/shared/ui'
import { addClinicDays, clinicDateOf, clinicToday, clinicWeekRange } from '@/shared/lib/clinicTime'
import { AppointmentChip } from './AppointmentChip'
import { groupByClinicDate, openDates } from '../lib/calendarDays'
import type { Appointment, AvailabilitySlot } from '../types'
import styles from './WeekView.module.css'

export interface WeekViewProps {
  date: string
  appointments: Appointment[]
  slots: AvailabilitySlot[]
  onAppointmentClick: (appointment: Appointment) => void
  onDateSelect: (dateIso: string) => void
  isLoading?: boolean
  hasSlotData: boolean
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const VISIBLE_CHIP_LIMIT = 3

export function WeekView({
  date,
  appointments,
  slots,
  onAppointmentClick,
  onDateSelect,
  isLoading,
  hasSlotData,
}: WeekViewProps) {
  const weekStart = clinicDateOf(clinicWeekRange(date).from)
  const days = Array.from({ length: 7 }, (_, index) => addClinicDays(weekStart, index))
  const byDate = groupByClinicDate(appointments)
  const open = openDates(slots)
  const today = clinicToday()

  return (
    <div className={styles.week}>
      {days.map((dayIso, index) => {
        const dayAppointments = byDate.get(dayIso) ?? []
        const visible = dayAppointments.slice(0, VISIBLE_CHIP_LIMIT)
        const overflowCount = dayAppointments.length - visible.length
        const isClosed = hasSlotData && !open.has(dayIso)

        return (
          <div
            key={dayIso}
            data-testid={`week-day-${dayIso}`}
            className={`${styles.dayCell} ${dayIso === today ? styles.today : ''}`}
          >
            <div className={styles.dayHeader}>
              <span>{WEEKDAY_HEADERS[index]}</span>
              <span className={styles.dayNumber}>{Number(dayIso.slice(8))}</span>
              {dayAppointments.length > 0 && (
                <span className={styles.countBadge}>{dayAppointments.length}</span>
              )}
            </div>
            {isClosed && <span className={styles.closed}>Closed</span>}
            <div className={styles.chips}>
              {isLoading ? (
                <Skeleton height="1.25rem" />
              ) : (
                <>
                  {visible.map((appointment) => (
                    <AppointmentChip
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => onAppointmentClick(appointment)}
                    />
                  ))}
                  {overflowCount > 0 && (
                    <button
                      type="button"
                      className={styles.overflow}
                      onClick={() => onDateSelect(dayIso)}
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
