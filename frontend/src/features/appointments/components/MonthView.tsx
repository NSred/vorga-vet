import { Skeleton } from '@/shared/ui'
import {
  addClinicDays,
  clinicDateOf,
  clinicMonthGridRange,
  clinicToday,
} from '@/shared/lib/clinicTime'
import { AppointmentChip } from './AppointmentChip'
import { groupByClinicDate, openDates } from '../lib/calendarDays'
import type { Appointment, AvailabilitySlot } from '../types'
import styles from './MonthView.module.css'

export interface MonthViewProps {
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

export function MonthView({
  date,
  appointments,
  slots,
  onAppointmentClick,
  onDateSelect,
  isLoading,
  hasSlotData,
}: MonthViewProps) {
  const gridStart = clinicDateOf(clinicMonthGridRange(date).from)
  const days = Array.from({ length: 42 }, (_, index) => addClinicDays(gridStart, index))
  const byDate = groupByClinicDate(appointments)
  const open = openDates(slots)
  const today = clinicToday()
  const visibleMonth = date.slice(0, 7)

  return (
    <div className={styles.month}>
      {WEEKDAY_HEADERS.map((header) => (
        <div key={header} className={styles.weekdayHeader}>
          {header}
        </div>
      ))}

      {days.map((dayIso) => {
        const dayAppointments = byDate.get(dayIso) ?? []
        const visible = dayAppointments.slice(0, VISIBLE_CHIP_LIMIT)
        const overflowCount = dayAppointments.length - visible.length
        const isClosed = hasSlotData && !open.has(dayIso)
        const isOtherMonth = dayIso.slice(0, 7) !== visibleMonth

        return (
          <div
            key={dayIso}
            data-testid={`month-day-${dayIso}`}
            className={`${styles.dayCell} ${dayIso === today ? styles.today : ''} ${
              isOtherMonth ? styles.otherMonth : ''
            }`}
          >
            <span className={styles.dayNumber}>{Number(dayIso.slice(8))}</span>
            {isClosed && <span className={styles.closed}>Closed</span>}
            <div className={styles.chips}>
              {isLoading ? (
                <Skeleton height="1rem" />
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
