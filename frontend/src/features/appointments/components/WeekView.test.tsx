import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WeekView } from './WeekView'
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

function renderWeek(appointments: Appointment[], onDateSelect = vi.fn()) {
  render(
    <WeekView
      date="2026-09-17"
      appointments={appointments}
      slots={[openSlot]}
      onAppointmentClick={vi.fn()}
      onDateSelect={onDateSelect}
      isLoading={false}
      hasSlotData
    />,
  )

  return onDateSelect
}

describe('WeekView', () => {
  it('puts an appointment in its clinic day, not its UTC day', () => {
    renderWeek([appointment('a1', '2026-09-16T23:30:00Z', 'Luna')])

    expect(screen.getByTestId('week-day-2026-09-17')).toHaveTextContent('Luna')
  })

  it('marks days with no slots as closed in their header', () => {
    renderWeek([])

    expect(screen.getByRole('button', { name: 'Open Fri 18' })).toHaveTextContent('Closed')
    expect(screen.getByRole('button', { name: 'Open Thu 17' })).not.toHaveTextContent('Closed')
  })

  it('stretches a long visit over its rows and counts the visits per day', () => {
    renderWeek([
      { ...appointment('a1', '2026-09-17T05:00:00Z', 'Luna'), durationMinutes: 90 },
      appointment('a2', '2026-09-17T06:30:00Z', 'Rex'),
    ])

    expect(screen.getByRole('button', { name: /Luna/ }).style.gridRow).toBe('1 / span 3')
    expect(screen.getByRole('button', { name: /Rex/ }).style.gridRow).toBe('4 / span 1')
    expect(screen.getByRole('button', { name: 'Open Thu 17' })).toHaveTextContent('2')
  })

  it('opens the day from its header', async () => {
    const user = userEvent.setup()
    const onDateSelect = renderWeek([appointment('a1', '2026-09-17T05:00:00Z', 'Luna')])

    await user.click(screen.getByRole('button', { name: 'Open Thu 17' }))

    expect(onDateSelect).toHaveBeenCalledWith('2026-09-17')
  })
})
