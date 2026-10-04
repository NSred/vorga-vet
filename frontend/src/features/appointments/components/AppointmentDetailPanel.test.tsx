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

describe('AppointmentDetailPanel actions', () => {
  const handlers = { onReschedule: vi.fn(), onCancel: vi.fn(), onNoShow: vi.fn() }

  function renderWith(overrides: Partial<Appointment>) {
    render(
      <AppointmentDetailPanel
        appointment={{ ...appointment, ...overrides }}
        open
        onOpenChange={vi.fn()}
        patientSection={null}
        {...handlers}
      />,
    )
  }

  it('offers every action for a scheduled appointment whose time has passed', () => {
    renderWith({ status: 'scheduled' })

    expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel appointment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No-show' })).toBeInTheDocument()
  })

  it('holds back no-show until the start time has passed', () => {
    renderWith({
      status: 'scheduled',
      startsAt: '2099-01-01T08:00:00Z',
      endsAt: '2099-01-01T08:30:00Z',
    })

    expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel appointment' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'No-show' })).not.toBeInTheDocument()
  })

  it('allows only cancel once checked in', () => {
    renderWith({ status: 'checked_in' })

    expect(screen.queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel appointment' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'No-show' })).not.toBeInTheDocument()
  })

  it('offers nothing for a closed appointment', () => {
    renderWith({ status: 'completed' })

    expect(screen.queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel appointment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'No-show' })).not.toBeInTheDocument()
  })
})

describe('AppointmentDetailPanel visit actions', () => {
  function renderWith(status: Appointment['status']) {
    render(
      <AppointmentDetailPanel
        appointment={{ ...appointment, status }}
        open
        onOpenChange={vi.fn()}
        patientSection={null}
        onCheckIn={vi.fn()}
        onComplete={vi.fn()}
      />,
    )
  }

  it('offers check-in and complete while scheduled', () => {
    renderWith('scheduled')

    expect(screen.getByRole('button', { name: 'Check in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete visit' })).toBeInTheDocument()
  })

  it('offers only complete once checked in', () => {
    renderWith('checked_in')

    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete visit' })).toBeInTheDocument()
  })

  it('offers neither once completed', () => {
    renderWith('completed')

    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Complete visit' })).not.toBeInTheDocument()
  })
})
