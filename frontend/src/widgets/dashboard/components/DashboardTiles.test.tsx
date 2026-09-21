import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery } from '@/test/renderWithQuery'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import type { Appointment } from '@/features/appointments'
import { clinicDayRange, clinicToday } from '@/shared/lib/clinicTime'
import { PeakHourTile } from './PeakHourTile'
import { ScheduledTodayTile } from './ScheduledTodayTile'
import { TotalPatientsTile } from './TotalPatientsTile'

function todayAt(id: string, time: string, status: Appointment['status'] = 'scheduled'): Appointment {
  const startsAt = `${clinicToday()}T${time}:00.000Z`

  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status,
    createdAt: '2026-09-10T10:00:00Z',
  }
}

function withinClinicToday(id: string, status: Appointment['status'] = 'scheduled'): Appointment {
  const startsAt = clinicDayRange(clinicToday()).from

  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status,
    createdAt: '2026-09-10T10:00:00Z',
  }
}

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
    items: [],
    totalCount: 42,
    page: 1,
    pageSize: 10,
  })
  getAppointmentsSpy = vi
    .spyOn(appointmentsApi, 'getAppointments')
    .mockResolvedValue([todayAt('a1', '07:15'), todayAt('a2', '07:45')])
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
  it('shows the busiest clinic hour and today total', async () => {
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
  it('requests only the clinic day', async () => {
    renderInRouter(<ScheduledTodayTile />)

    await waitFor(() =>
      expect(getAppointmentsSpy).toHaveBeenCalledWith(clinicDayRange(clinicToday())),
    )
    expect(await screen.findByText('2')).toBeInTheDocument()
  })

  it('counts an appointment at the edge of the clinic day', async () => {
    getAppointmentsSpy.mockResolvedValue([withinClinicToday('a3')])

    renderInRouter(<ScheduledTodayTile />)

    expect(await screen.findByText('1')).toBeInTheDocument()
  })

  it('ignores cancelled and no-show appointments', async () => {
    getAppointmentsSpy.mockResolvedValue([
      todayAt('a1', '07:15', 'cancelled'),
      todayAt('a2', '07:45', 'no_show'),
    ])

    renderInRouter(<ScheduledTodayTile />)

    expect(await screen.findByText('0')).toBeInTheDocument()
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
