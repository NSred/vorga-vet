import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import { resetChargesStore } from '@/features/priceList/api/mockChargesStore'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { reportExamination, reportPatient } from '@/test/reportFixtures'
import { ReportsPage } from './ReportsPage'

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'v@x.com', role: 'veterinarian' } }),
  useCurrentUser: () => ({
    data: { id: 'u1', firstName: 'Mira', lastName: 'Vet', email: 'v@x.com' },
  }),
}))

const luna = reportPatient()

function renderPage(path = '/reports') {
  const router = createMemoryRouter([{ path: '/reports', element: <ReportsPage /> }], {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  resetChargesStore()
  vi.spyOn(patientsApi, 'getPatients').mockImplementation(async (filters, page, pageSize) => {
    const items = filters.status === 'deleted' ? [] : [luna]
    return { items, totalCount: items.length, page, pageSize }
  })
  vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([
    reportExamination({ startedAt: '2026-09-30T10:00:00Z' }),
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ReportsPage', () => {
  it('opens on the daily report for today', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Daily report' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Print' })).toBeEnabled()
  })

  it('prints the current report on P', async () => {
    const user = userEvent.setup()
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    renderPage('/reports?day=2026-09-30')
    await screen.findByText('Luna', { selector: 'span' })

    await user.keyboard('p')

    await waitFor(() => expect(print).toHaveBeenCalledTimes(1))
  })

  it('restores the view and the day from the address', async () => {
    renderPage('/reports?day=2026-09-30')

    expect(await screen.findByText('Luna', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Today' })).toBeEnabled()
  })

  it('falls back to the daily report for an unknown view and keeps the day in the address', async () => {
    const user = userEvent.setup()
    const router = renderPage('/reports?view=nope&day=bad')

    expect(screen.getByRole('region', { name: 'Daily report' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous day' }))
    expect(router.state.location.search).toMatch(/^\?day=\d{4}-\d{2}-\d{2}$/)

    await user.click(screen.getByRole('button', { name: 'Unpaid exams' }))
    expect(router.state.location.search).toBe('?view=unpaid')
    expect(screen.getByRole('region', { name: 'Unpaid exams' })).toBeInTheDocument()
  })

  it('shows the deleted cards view', async () => {
    renderPage('/reports?view=deleted')

    expect(await screen.findByText('No patient card has been deleted.')).toBeInTheDocument()
  })

  it("opens the patient's card on top of the report", async () => {
    const user = userEvent.setup()
    vi.spyOn(patientsApi, 'getPatient').mockResolvedValue({
      ...luna,
      ownerId: 'o1',
      breedId: 'b1',
      createdAt: '2026-08-27',
      allergies: [],
    })
    const router = renderPage('/reports?view=unpaid')

    await user.click(await screen.findByText('Luna', { selector: 'span' }))

    expect(await screen.findByRole('dialog', { name: 'Record for Luna' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/reports')
    expect(router.state.location.search).toBe('?view=unpaid')

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Record for Luna' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('region', { name: 'Unpaid exams' })).toBeInTheDocument()
  })
})
