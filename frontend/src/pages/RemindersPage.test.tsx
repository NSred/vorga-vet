import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addClinicDays, clinicToday } from '@/shared/lib/clinicTime'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as patientsApi from '@/features/patients/api/patientsApi'
import type { PatientDetail } from '@/features/patients'
import {
  addManualVaccination,
  addReminder,
  listDue,
  resetVaccinationsStore,
} from '@/features/vaccinations/api/mockVaccinationsStore'
import { RemindersPage } from './RemindersPage'

const today = clinicToday()

const luna = {
  id: 'p1',
  cardNumber: 'C26-1',
  name: 'Luna',
  species: 'cat',
  breedName: 'Chartreux',
  sex: 'female',
  isDeleted: false,
  ownerName: 'Ana Petrović',
  phoneNumber: '062 123 456',
  city: 'Novi Sad',
  allergies: [],
  ownerId: 'o1',
  breedId: 'b1',
  createdAt: '2026-01-01T00:00:00Z',
} as unknown as PatientDetail

function renderPage(path = '/reminders') {
  const router = createMemoryRouter([{ path: '/reminders', element: <RemindersPage /> }], {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  resetVaccinationsStore()
  vi.spyOn(patientsApi, 'getPatient').mockResolvedValue(luna)
  addManualVaccination('p1', {
    vaccineName: 'Vanguard Plus 7',
    isRabies: false,
    givenOn: addClinicDays(today, -400),
    dueOn: addClinicDays(today, -35),
  })
  addManualVaccination('p1', {
    vaccineName: 'Nobivac Rabies',
    isRabies: true,
    givenOn: addClinicDays(today, -362),
    dueOn: addClinicDays(today, 3),
  })
  addReminder('p1', { date: addClinicDays(today, 20), reason: 'Remind about spaying' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RemindersPage', () => {
  it('shows the next 7 days with the owner and phone', async () => {
    renderPage()

    const list = await screen.findByRole('list', { name: 'Next 7 days' })
    expect(within(list).getByText('Nobivac Rabies')).toBeInTheDocument()
    expect(
      await within(list).findByRole('link', { name: 'Call Ana Petrović, 062 123 456' }),
    ).toHaveAttribute('href', 'tel:062123456')
    expect(within(list).getByText(/Ana Petrović/)).toBeInTheDocument()
    expect(within(list).getByText(/^In 3 days · /)).toBeInTheDocument()
    expect(within(list).queryByText('Vanguard Plus 7')).not.toBeInTheDocument()
    expect(within(list).queryByText('Remind about spaying')).not.toBeInTheDocument()
  })

  it('switches views and keeps the view in the URL', async () => {
    const user = userEvent.setup()
    const router = renderPage('/reminders?window=overdue')

    const overdue = await screen.findByRole('list', { name: 'Overdue' })
    expect(within(overdue).getByText('Vanguard Plus 7')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next 30 days' }))
    const month = await screen.findByRole('list', { name: 'Next 30 days' })
    expect(within(month).getByText('Remind about spaying')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?window=month')
  })

  it('keeps a contacted vaccination on the list and drops a done reminder', async () => {
    const user = userEvent.setup()
    renderPage('/reminders?window=month')

    const list = await screen.findByRole('list', { name: 'Next 30 days' })
    await user.click(within(list).getByRole('button', { name: 'Mark contacted' }))
    expect(await within(list).findByText(/^Contacted/)).toBeInTheDocument()

    await user.click(within(list).getByRole('button', { name: 'Mark done' }))
    await waitFor(() => expect(screen.queryByText('Remind about spaying')).not.toBeInTheDocument())
    expect(screen.getByText('Nobivac Rabies')).toBeInTheDocument()
  })

  it('a dose given today replaces the old one and shows as due in a year', async () => {
    addManualVaccination('p1', {
      vaccineName: 'Nobivac Rabies',
      isRabies: true,
      givenOn: today,
      dueOn: addClinicDays(today, 365),
    })
    renderPage('/reminders?window=year')

    const list = await screen.findByRole('list', { name: 'Next 12 months' })
    expect(within(list).getAllByText('Nobivac Rabies')).toHaveLength(1)
    expect(
      listDue(addClinicDays(today, 365)).find((item) => item.title === 'Nobivac Rabies')?.dueOn,
    ).toBe(addClinicDays(today, 365))
  })
})
