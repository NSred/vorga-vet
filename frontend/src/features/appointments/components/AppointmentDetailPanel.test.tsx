import { render, screen, within } from '@testing-library/react'
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

    expect(screen.getByText(/17.09.2026 · 30 min/)).toBeInTheDocument()
    expect(screen.getByText('07:00 – 07:30')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'Open record ›' }))
    expect(onOpenPatientRecord).toHaveBeenCalledTimes(1)

    rerender(
      <AppointmentDetailPanel
        appointment={appointment}
        open
        onOpenChange={vi.fn()}
        patientSection={<p>patient here</p>}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Open record ›' })).not.toBeInTheDocument()
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

describe('AppointmentDetailPanel stepper', () => {
  function renderWith(status: Appointment['status']) {
    render(
      <AppointmentDetailPanel
        appointment={{ ...appointment, status }}
        open
        onOpenChange={vi.fn()}
        patientSection={null}
        onCheckIn={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
  }

  function currentStep() {
    return within(screen.getByRole('list', { name: 'Visit progress' }))
      .getAllByRole('listitem')
      .find((item) => item.getAttribute('aria-current') === 'step')
  }

  it.each([
    ['scheduled', 'Scheduled', 'Check in'],
    ['checked_in', 'Checked in', 'Complete visit'],
  ] as const)(
    'marks %s as the current step and leads with the next action',
    (status, step, next) => {
      renderWith(status)

      expect(currentStep()).toHaveTextContent(step)
      expect(screen.getAllByRole('button', { name: next })[0]).toHaveClass(/primary/)
    },
  )

  it('shows every step done once completed', () => {
    renderWith('completed')

    expect(currentStep()).toHaveTextContent('Completed')
    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument()
  })

  it.each([
    ['cancelled', 'Cancelled'],
    ['no_show', 'No show'],
  ] as const)('replaces the stepper with the state of a %s visit', (status, label) => {
    renderWith(status)

    expect(screen.queryByRole('list', { name: 'Visit progress' })).not.toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
