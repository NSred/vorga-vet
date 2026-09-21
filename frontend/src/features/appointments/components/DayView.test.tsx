import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DayView } from './DayView'
import type { Appointment, AvailabilitySlot } from '../types'

const slots: AvailabilitySlot[] = [
  {
    startsAt: '2026-09-17T05:00:00Z',
    endsAt: '2026-09-17T05:30:00Z',
    isAvailable: false,
    isMine: false,
  },
  {
    startsAt: '2026-09-17T05:30:00Z',
    endsAt: '2026-09-17T06:00:00Z',
    isAvailable: true,
    isMine: false,
  },
]

const appointment: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  patientId: 'p1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

function renderDay(
  appointments: Appointment[],
  daySlots: AvailabilitySlot[],
  hasSlotData = true,
) {
  render(
    <DayView
      date="2026-09-17"
      slots={daySlots}
      appointments={appointments}
      onAppointmentClick={vi.fn()}
      isLoading={false}
      hasSlotData={hasSlotData}
    />,
  )
}

describe('DayView', () => {
  it('renders a row per slot with clinic times', () => {
    renderDay([], slots)

    expect(screen.getByText('07:00')).toBeInTheDocument()
    expect(screen.getByText('07:30')).toBeInTheDocument()
  })

  it('shows the appointment in its slot and marks free slots', () => {
    renderDay([appointment], slots)

    expect(screen.getByRole('button', { name: /Luna/ })).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('marks the slots a long appointment continues into', () => {
    renderDay([{ ...appointment, durationMinutes: 60, endsAt: '2026-09-17T06:00:00Z' }], slots)

    expect(screen.getByText('↳ continues')).toBeInTheDocument()
  })

  it('says the clinic is closed when there are no slots', () => {
    renderDay([], [])

    expect(screen.getByText('The clinic is closed on this day.')).toBeInTheDocument()
  })

  it('does not claim closed when slot data is missing', () => {
    renderDay([], [], false)

    expect(screen.queryByText('The clinic is closed on this day.')).not.toBeInTheDocument()
  })

  it('groups appointments outside opening hours', () => {
    renderDay(
      [{ ...appointment, startsAt: '2026-09-17T03:00:00Z', endsAt: '2026-09-17T03:30:00Z' }],
      slots,
    )

    expect(screen.getByText('Outside opening hours')).toBeInTheDocument()
  })
})
