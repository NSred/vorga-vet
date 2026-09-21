import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentDetailPanel } from './AppointmentDetailPanel'
import type { Appointment } from '../types'

const appointment: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: 'o1',
  patientId: 'p1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'surgery',
  status: 'checked_in',
  reason: 'limping',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

describe('AppointmentDetailPanel', () => {
  it('shows the appointment details in clinic time', () => {
    render(
      <AppointmentDetailPanel
        appointment={appointment}
        open
        onOpenChange={vi.fn()}
        patientSection={<p>patient here</p>}
      />,
    )

    expect(screen.getAllByText('17.09.2026').length).toBeGreaterThan(0)
    expect(screen.getByText('07:00–07:30')).toBeInTheDocument()
    expect(screen.getByText('Surgery')).toBeInTheDocument()
    expect(screen.getByText('Checked in')).toBeInTheDocument()
    expect(screen.getByText('limping')).toBeInTheDocument()
    expect(screen.getByText('patient here')).toBeInTheDocument()
  })

  it('offers the patient record only when the callback is given', async () => {
    const onOpenPatientRecord = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <AppointmentDetailPanel
        appointment={appointment}
        open
        onOpenChange={vi.fn()}
        patientSection={<p>patient here</p>}
        onOpenPatientRecord={onOpenPatientRecord}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Patient record' }))
    expect(onOpenPatientRecord).toHaveBeenCalledTimes(1)

    rerender(
      <AppointmentDetailPanel
        appointment={appointment}
        open
        onOpenChange={vi.fn()}
        patientSection={<p>patient here</p>}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Patient record' })).not.toBeInTheDocument()
  })
})
