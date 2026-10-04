import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MonthView } from './MonthView'
import type { Appointment, AvailabilitySlot } from '../types'

function appointment(id: string, startsAt: string, patientName: string): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status: 'scheduled',
    patientName,
    ownerName: 'Ana Petrović',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

const openSlot: AvailabilitySlot = {
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  isAvailable: true,
  isMine: false,
}

function renderMonth(appointments: Appointment[]) {
  render(
    <MonthView
      date="2026-09-17"
      appointments={appointments}
      slots={[openSlot]}
      onAppointmentClick={vi.fn()}
      onDateSelect={vi.fn()}
      isLoading={false}
      hasSlotData
    />,
  )
}

describe('MonthView', () => {
  it('renders the 42-day grid', () => {
    renderMonth([])

    expect(screen.getAllByTestId(/^month-day-/)).toHaveLength(42)
  })

  it('puts an appointment in its clinic day, not its UTC day', () => {
    renderMonth([appointment('a1', '2026-09-16T23:30:00Z', 'Luna')])

    expect(screen.getByTestId('month-day-2026-09-17')).toHaveTextContent('Luna')
  })

  it('marks days with no slots as closed', () => {
    renderMonth([])

    expect(screen.getByTestId('month-day-2026-09-18')).toHaveTextContent('Closed')
    expect(screen.getByTestId('month-day-2026-09-17')).not.toHaveTextContent('Closed')
  })
})
