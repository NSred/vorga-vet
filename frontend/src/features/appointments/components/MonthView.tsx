import { useState } from 'react'
import { Button, Skeleton } from '@/shared/ui'
import {
  addClinicDays,
  clinicDateOf,
  clinicMonthGridRange,
  clinicToday,
  MONDAY_FIRST_WEEKDAYS,
  weekdayName,
} from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { AgendaRow } from './AgendaRow'
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

const VISIBLE_CHIP_LIMIT = 3

function countLabel(count: number): string {
  return `${count} ${count === 1 ? 'appointment' : 'appointments'}`
}

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
  const [picked, setPicked] = useState<string | null>(null)
  const preview =
    picked && picked.slice(0, 7) === visibleMonth
      ? picked
      : today.slice(0, 7) === visibleMonth
        ? today
        : null
  const previewItems = preview
    ? [...(byDate.get(preview) ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    : []

  return (
    <>
      <div className={styles.month}>
        {MONDAY_FIRST_WEEKDAYS.map((header) => (
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
              } ${dayIso === preview ? styles.picked : ''}`}
            >
              <span className={styles.dayNumber}>{Number(dayIso.slice(8))}</span>
              {!isLoading && !isOtherMonth && (
                <button
                  type="button"
                  className={styles.phoneOpen}
                  onClick={() => setPicked(dayIso)}
                  aria-pressed={dayIso === preview}
                  aria-label={`Show ${formatDisplayDate(dayIso)}${dayAppointments.length > 0 ? `, ${countLabel(dayAppointments.length)}` : ''}`}
                >
                  {dayAppointments.length > 0 ? dayAppointments.length : ''}
                </button>
              )}
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

      {preview && !isLoading && (
        <section className={styles.preview} aria-label="Selected day">
          <div className={styles.previewHeading}>
            <span className={styles.previewTitle}>
              {weekdayName(preview)}, {formatDisplayDate(preview)}
            </span>
            <span className={styles.previewCount}>{countLabel(previewItems.length)}</span>
          </div>
          {previewItems.length === 0 ? (
            <p className={styles.previewEmpty}>Nothing booked on this day.</p>
          ) : (
            <div className={styles.previewRows}>
              {previewItems.map((appointment) => (
                <AgendaRow
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onAppointmentClick(appointment)}
                />
              ))}
            </div>
          )}
          <Button variant="outline" type="button" onClick={() => onDateSelect(preview)}>
            Open day
          </Button>
        </section>
      )}
    </>
  )
}
