import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import { WalkInPanel } from './WalkInPanel'

vi.mock('@/features/auth', () => ({
  useCurrentUser: () => ({
    data: { id: 'u1', firstName: 'Mira', lastName: 'Vet', email: 'v@x.com' },
  }),
}))

function renderPanel() {
  const props = { onOpenChange: vi.fn(), onRecorded: vi.fn(), onPaid: vi.fn() }
  const router = createMemoryRouter([{ path: '/', element: <WalkInPanel open {...props} /> }], {
    initialEntries: ['/'],
  })
  render(<RouterProvider router={router} />)

  return props
}

let createSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  createSpy = vi.spyOn(examinationsApi, 'createExamination').mockResolvedValue('e5')
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
    items: [
      {
        id: 'p1',
        cardNumber: 'C26-1',
        name: 'Luna',
        species: 'cat',
        breedName: 'Chartreux',
        sex: 'female',
        isDeleted: false,
        ownerName: 'Ana Petrović',
        phoneNumber: '062',
        city: 'Novi Sad',
        allergies: [],
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 10,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WalkInPanel', () => {
  it('requires a patient', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'Record visit' }))

    expect(await screen.findByText('Pick the patient')).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('posts the patient and the examination, then offers to mark it paid', async () => {
    const user = userEvent.setup()
    const props = renderPanel()

    await user.click(screen.getByRole('button', { name: /^Patient/ }))
    await user.click(await screen.findByText('Luna · Ana Petrović'))
    await user.type(screen.getByLabelText('Therapy'), 'drops')
    await user.type(screen.getByLabelText('Cost'), '20')
    await user.click(screen.getByRole('button', { name: 'Record visit' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({
        patientId: 'p1',
        examination: expect.objectContaining({
          performedByFirstName: 'Mira',
          therapy: 'drops',
          cost: 20,
        }),
      }),
    )
    expect(props.onRecorded).toHaveBeenCalledWith('e5')
    expect(await screen.findByRole('button', { name: 'Mark as paid' })).toBeInTheDocument()
  })

  it('links to Patient Records for animals without a card', () => {
    renderPanel()

    expect(screen.getByRole('link', { name: 'Patient Records' })).toHaveAttribute(
      'href',
      '/patients',
    )
  })
})
