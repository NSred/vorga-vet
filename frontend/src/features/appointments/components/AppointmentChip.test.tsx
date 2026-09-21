import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentChip } from './AppointmentChip'
import type { Appointment } from '../types'

const base: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: 'o1',
  patientId: 'p1',
  startsAt: '2026-09-17T07:00:00Z',
  endsAt: '2026-09-17T07:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  reason: 'limping',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

describe('AppointmentChip', () => {
  it('shows the clinic start time, patient and owner', () => {
    render(<AppointmentChip appointment={base} onClick={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('09:00')
    expect(screen.getByRole('button')).toHaveTextContent('Luna · Ana Petrović')
  })

  it('shows a time range for a longer appointment', () => {
    const surgery: Appointment = {
      ...base,
      type: 'surgery',
      durationMinutes: 90,
      endsAt: '2026-09-17T08:30:00Z',
    }

    render(<AppointmentChip appointment={surgery} onClick={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('09:00–10:30')
  })

  it('explains a booking with no patient', () => {
    render(
      <AppointmentChip
        appointment={{ ...base, patientId: undefined, patientName: undefined }}
        onClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toHaveTextContent('No patient yet · Ana Petrović')
  })

  it('falls back to a client booking label with no owner either', () => {
    render(
      <AppointmentChip
        appointment={{
          ...base,
          patientId: undefined,
          patientName: undefined,
          ownerId: undefined,
          ownerName: undefined,
        }}
        onClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toHaveTextContent('Client booking')
  })

  it('describes type, status and reason in the tooltip', () => {
    render(<AppointmentChip appointment={{ ...base, status: 'checked_in' }} onClick={vi.fn()} />)

    expect(screen.getByRole('button').title).toBe('Checkup · Checked in · limping')
  })

  it('calls onClick', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<AppointmentChip appointment={base} onClick={onClick} />)
    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
