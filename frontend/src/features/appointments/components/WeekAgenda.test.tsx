import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WeekAgenda } from './WeekAgenda'
import type { Appointment, AvailabilitySlot } from '../types'

function appointment(id: string, startsAt: string, patientName?: string): Appointment {
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

const mondaySlot: AvailabilitySlot = {
  startsAt: '2026-09-14T07:00:00Z',
  endsAt: '2026-09-14T07:30:00Z',
  isAvailable: true,
  isMine: false,
}

describe('WeekAgenda', () => {
  it('groups the week by day in time order and opens a visit', async () => {
    const onClick = vi.fn()
    const late = appointment('a2', '2026-09-17T09:00:00Z', 'Rex')
    render(
      <WeekAgenda
        date="2026-09-17"
        appointments={[late, appointment('a1', '2026-09-17T05:00:00Z', 'Luna')]}
        slots={[mondaySlot]}
        onAppointmentClick={onClick}
        hasSlotData
      />,
    )

    const thursday = screen.getByRole('region', { name: 'Thu 17' })
    const rows = within(thursday).getAllByRole('button')
    expect(rows[0]).toHaveTextContent('Luna')
    expect(rows[1]).toHaveTextContent('Rex')

    await userEvent.click(rows[1])
    expect(onClick).toHaveBeenCalledWith(late)
  })

  it('tells an open empty day from a closed one', () => {
    render(
      <WeekAgenda
        date="2026-09-17"
        appointments={[]}
        slots={[mondaySlot]}
        onAppointmentClick={vi.fn()}
        hasSlotData
      />,
    )

    expect(screen.getByRole('region', { name: 'Mon 14' })).toHaveTextContent('No appointments')
    expect(screen.getByRole('region', { name: 'Tue 15' })).toHaveTextContent('Closed')
  })

  it('names a booking without a patient', () => {
    render(
      <WeekAgenda
        date="2026-09-17"
        appointments={[appointment('a1', '2026-09-17T05:00:00Z')]}
        slots={[]}
        onAppointmentClick={vi.fn()}
        hasSlotData={false}
      />,
    )

    expect(screen.getByRole('region', { name: 'Thu 17' })).toHaveTextContent('No patient yet')
  })
})
