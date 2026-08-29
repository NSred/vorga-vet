import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery } from '@/test/renderWithQuery'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import { todayIso } from '@/shared/lib/dateOnly'
import { PeakHourTile } from './PeakHourTile'
import { ScheduledTodayTile } from './ScheduledTodayTile'
import { TotalPatientsTile } from './TotalPatientsTile'

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
    items: [],
    totalCount: 42,
    page: 1,
    pageSize: 10,
  })
  getAppointmentsSpy = vi.spyOn(appointmentsApi, 'getAppointments').mockResolvedValue([
    {
      id: 'a1',
      patientId: 'p1',
      date: todayIso(),
      time: '09:15',
      type: 'checkup',
      reminderEnabled: false,
      attachments: [],
    },
    {
      id: 'a2',
      patientId: 'p2',
      date: todayIso(),
      time: '09:45',
      type: 'checkup',
      reminderEnabled: false,
      attachments: [],
    },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderInRouter(element: ReactNode) {
  const router = createMemoryRouter([{ path: '/', element }], { initialEntries: ['/'] })
  return renderWithQuery(<RouterProvider router={router} />)
}

describe('TotalPatientsTile', () => {
  it('shows the active patient count', async () => {
    renderWithQuery(<TotalPatientsTile />)

    expect(await screen.findByText('42')).toBeInTheDocument()
  })
})

describe('PeakHourTile', () => {
  it('shows the busiest hour and today total', async () => {
    renderWithQuery(<PeakHourTile onOpenBreakdown={vi.fn()} />)

    expect(await screen.findByText('09:00')).toBeInTheDocument()
    expect(await screen.findByText('2 of 2 appointments')).toBeInTheDocument()
  })

  it('shows a dash when nothing is scheduled', async () => {
    getAppointmentsSpy.mockResolvedValue([])

    renderWithQuery(<PeakHourTile onOpenBreakdown={vi.fn()} />)

    expect(await screen.findByText('—')).toBeInTheDocument()
  })
})

describe('ScheduledTodayTile', () => {
  it('counts only today', async () => {
    renderInRouter(<ScheduledTodayTile />)

    expect(await screen.findByText('2')).toBeInTheDocument()
  })
})

describe('tile independence', () => {
  it('shares one appointments request across both tiles', async () => {
    renderInRouter(
      <>
        <PeakHourTile onOpenBreakdown={vi.fn()} />
        <ScheduledTodayTile />
      </>,
    )

    await waitFor(() => expect(getAppointmentsSpy).toHaveBeenCalledTimes(1))
  })
})
