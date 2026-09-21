import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as appointmentsApi from '../api/appointmentsApi'
import { UnresolvedBanner } from './UnresolvedBanner'
import { UnresolvedPanel } from './UnresolvedPanel'
import type { Appointment } from '../types'

const stale: Appointment = {
  id: 'a7',
  createdByUserId: 'u1',
  patientId: 'p1',
  startsAt: '2026-09-10T07:00:00Z',
  endsAt: '2026-09-10T07:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-01T10:00:00Z',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('UnresolvedBanner', () => {
  it('renders nothing when there is nothing to close', async () => {
    const spy = vi.spyOn(appointmentsApi, 'getUnresolvedAppointments').mockResolvedValue([])

    render(<UnresolvedBanner onOpen={vi.fn()} />)

    await vi.waitFor(() => expect(spy).toHaveBeenCalled())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the count and opens the list', async () => {
    vi.spyOn(appointmentsApi, 'getUnresolvedAppointments').mockResolvedValue([stale])
    const onOpen = vi.fn()

    render(<UnresolvedBanner onOpen={onOpen} />)

    expect(await screen.findByText('1 appointment needs closing')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Review' }))
    expect(onOpen).toHaveBeenCalled()
  })
})

describe('UnresolvedPanel', () => {
  it('lists the appointments and reports a click', async () => {
    vi.spyOn(appointmentsApi, 'getUnresolvedAppointments').mockResolvedValue([stale])
    const onSelect = vi.fn()

    render(<UnresolvedPanel open onOpenChange={vi.fn()} onSelect={onSelect} />)

    const row = await screen.findByRole('button', { name: /Luna · Ana Petrović/ })
    expect(row).toHaveTextContent('10.09.2026 · 09:00')
    expect(row).toHaveTextContent('Checkup')

    await userEvent.click(row)
    expect(onSelect).toHaveBeenCalledWith(stale)
  })
})
