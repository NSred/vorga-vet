import { layout, Skeleton } from '@/shared/ui'
import { clinicToday, MONDAY_FIRST_WEEKDAYS } from '@/shared/lib/clinicTime'
import { groupByClinicDate, openDates, weekDays } from '../lib/calendarDays'
import type { Appointment, AvailabilitySlot } from '../types'
import { AgendaDay } from './AgendaDay'

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

  const byDate = groupByClinicDate(appointments)
  const open = openDates(slots)
  const today = clinicToday()

  return (
    <div className={layout.stack}>
      {weekDays(date).map((day, index) => (
        <AgendaDay
          key={day}
          label={`${MONDAY_FIRST_WEEKDAYS[index]} ${Number(day.slice(8))}`}
          isToday={day === today}
          appointments={byDate.get(day) ?? []}
          emptyText={hasSlotData && !open.has(day) ? 'Closed' : 'No appointments'}
          onAppointmentClick={onAppointmentClick}
        />
      ))}
    </div>
  )
}
