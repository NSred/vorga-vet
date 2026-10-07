import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

function renderDay(appointments: Appointment[], daySlots: AvailabilitySlot[], hasSlotData = true) {
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

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DayView', () => {
  it('marks the current time inside the slot it falls in', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-17T05:45:00Z'))
    renderDay([], slots)

    const line = screen.getByTestId('now-line')
    expect(line).toHaveStyle({ gridRow: '2' })
    expect(line.style.marginTop).toBe('calc(0.5 * var(--day-slot-height))')
  })

  it('draws no time line on a day that is not today', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-18T05:45:00Z'))
    renderDay([], slots)

    expect(screen.queryByTestId('now-line')).not.toBeInTheDocument()
  })

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

  it('stretches a long appointment over the slots it covers, with its length', () => {
    renderDay([{ ...appointment, durationMinutes: 60, endsAt: '2026-09-17T06:00:00Z' }], slots)

    const block = screen.getByRole('button', { name: /Luna/ })
    expect(block.style.gridRow).toBe('1 / span 2')
    expect(block).toHaveTextContent('1h')
    expect(screen.queryByText('Free')).not.toBeInTheDocument()
    expect(screen.getByText('07:30')).toHaveClass(/labelBusy/)
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

  it('offers a free slot for booking when a handler is given', () => {
    const onSlotClick = vi.fn()
    render(
      <DayView
        date="2026-09-17"
        slots={slots}
        appointments={[appointment]}
        onAppointmentClick={vi.fn()}
        onSlotClick={onSlotClick}
        isLoading={false}
        hasSlotData
      />,
    )

    screen.getByRole('button', { name: 'Book 07:30' }).click()

    expect(onSlotClick).toHaveBeenCalledWith('2026-09-17T05:30:00Z')
  })

  it('labels unslotted appointments neutrally when slot data is missing', () => {
    renderDay([appointment], [], false)

    expect(screen.getByText('Opening hours unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Outside opening hours')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Luna/ })).toBeInTheDocument()
  })
})
