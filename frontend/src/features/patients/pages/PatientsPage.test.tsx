import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PatientsPage } from './PatientsPage'
import { ToastProvider } from '@/shared/ui'
import * as allergensApi from '../api/allergensApi'
import * as patientsApi from '../api/patientsApi'
import * as statsApi from '../api/statsApi'
import type { PatientListItem } from '../types'
import { ApiError } from '@/shared/lib/apiClient'

const patient: PatientListItem = {
  id: 'p1',
  cardNumber: 'D26-04821',
  name: 'Rex',
  species: 'dog',
  breedName: 'Pug',
  sex: 'male',
  isDeleted: false,
  ownerName: 'Marko Marković',
  phoneNumber: '060/1234567',
  city: 'Novi Sad',
  allergies: [],
}

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/patients', element: <PatientsPage /> }], {
    initialEntries: [path],
  })

  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

let getPatientsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  getPatientsSpy = vi
    .spyOn(patientsApi, 'getPatients')
    .mockResolvedValue({ items: [patient], totalCount: 25, page: 1, pageSize: 10 })
  vi.spyOn(statsApi, 'getDashboardStats').mockResolvedValue({
    totalPatients: 25,
    peakHour: null,
    todayAppointmentsCount: 0,
  })
  vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([{ id: 'a1', name: 'Pollen' }])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientsPage URL state', () => {
  it('requests the filters in the URL with no interaction', async () => {
    renderAt('/patients?species=dog&status=all&page=2')

    await waitFor(() => {
      expect(getPatientsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ species: 'dog', status: 'all' }),
        2,
        10,
      )
    })
  })

  it('defaults to active patients on page one', async () => {
    renderAt('/patients')

    await waitFor(() => {
      expect(getPatientsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
        1,
        10,
      )
    })
  })

  it('resolves an allergen name to its id before requesting the list', async () => {
    renderAt('/patients?allergen=Pollen')

    await waitFor(() => {
      expect(getPatientsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ allergen: { id: 'a1', name: 'Pollen' } }),
        1,
        10,
      )
    })
  })

  it('clears an allergen the backend does not know and still loads the list', async () => {
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])

    renderAt('/patients?allergen=Nonsense')

    await waitFor(() => {
      expect(getPatientsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ allergen: null }),
        1,
        10,
      )
    })
  })

  it('still renders rows when the URL allergen matches nothing', async () => {
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])

    renderAt('/patients?allergen=Nonsense')

    expect(await screen.findByText(/Rex/)).toBeInTheDocument()
  })

  it('returns to page one when a filter changes', async () => {
    const user = userEvent.setup()
    renderAt('/patients?page=3')

    await screen.findByText(/Rex/)
    getPatientsSpy.mockClear()

    await user.click(screen.getByRole('combobox', { name: 'Sex' }))
    await user.click(await screen.findByRole('option', { name: 'Female' }))

    await waitFor(() => {
      expect(getPatientsSpy).toHaveBeenCalledWith(expect.objectContaining({ sex: 'female' }), 1, 10)
    })
  })

  it('paginates without dropping the active filters', async () => {
    const user = userEvent.setup()
    renderAt('/patients?species=dog')

    await screen.findByText(/Rex/)
    getPatientsSpy.mockClear()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    await waitFor(() => {
      expect(getPatientsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ species: 'dog' }),
        2,
        10,
      )
    })
  })
})

describe('PatientsPage detail', () => {
  it('fetches the full detail when a row is clicked', async () => {
    const user = userEvent.setup()
    const getPatientSpy = vi.spyOn(patientsApi, 'getPatient').mockResolvedValue({
      ...patient,
      ownerId: 'o1',
      breedId: 'b1',
      createdAt: '2026-08-27',
      allergies: [],
    })

    renderAt('/patients')

    await user.click(await screen.findByText(/Rex/))

    await waitFor(() => {
      expect(getPatientSpy).toHaveBeenCalledWith('p1')
    })
  })
})

describe('PatientsPage delete', () => {
  function stubDetail() {
    vi.spyOn(patientsApi, 'getPatient').mockResolvedValue({
      ...patient,
      ownerId: 'o1',
      breedId: 'b1',
      createdAt: '2026-08-27',
      allergies: [],
    })
  }

  async function openAndConfirmDelete() {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderAt('/patients')
    await user.click(await screen.findByText(/Rex/))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
  }

  it('reports a failed delete instead of claiming success', async () => {
    stubDetail()
    const deleteSpy = vi
      .spyOn(patientsApi, 'deletePatient')
      .mockRejectedValue(new ApiError(500, 'boom'))

    await openAndConfirmDelete()

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('p1'))
    expect(await screen.findByText('Could not delete that patient')).toBeInTheDocument()
    expect(screen.queryByText('Patient deleted')).not.toBeInTheDocument()
  })

  it('treats an already-deleted patient as success', async () => {
    stubDetail()
    vi.spyOn(patientsApi, 'deletePatient').mockRejectedValue(
      new ApiError(400, 'gone', 'Patients.AlreadyDeleted'),
    )

    await openAndConfirmDelete()

    expect(await screen.findByText('Patient deleted')).toBeInTheDocument()
  })
})
