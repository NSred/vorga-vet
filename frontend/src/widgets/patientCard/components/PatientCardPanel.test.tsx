import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import type { PatientDetail } from '@/features/patients'
import { PatientCardPanel } from './PatientCardPanel'

const auth = vi.hoisted(() => ({ role: 'veterinarian' as 'veterinarian' | 'client' }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'user@example.com', role: auth.role } }),
  useCurrentUser: () => ({
    data: { id: 'u1', firstName: 'Mira', lastName: 'Vet', email: 'v@x.com' },
  }),
}))

const rex: PatientDetail = {
  id: 'p1',
  cardNumber: 'D26-04821',
  name: 'Rex',
  species: 'dog',
  breedName: 'Pug',
  sex: 'male',
  isDeleted: false,
  ownerName: 'Ana Petrović',
  phoneNumber: '062 123 456',
  city: 'Novi Sad',
  allergies: [],
  ownerId: 'o1',
  breedId: 'b1',
  createdAt: '2026-01-01',
}

const SECTIONS = ['Vaccinations', 'Microchip', 'Reminders', 'Visits']

function renderCard(onEditVisit = vi.fn()) {
  render(
    <PatientCardPanel
      patient={rex}
      open
      onOpenChange={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onEditVisit={onEditVisit}
    />,
  )
}

beforeEach(() => {
  vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([])
})

afterEach(() => {
  auth.role = 'veterinarian'
  vi.restoreAllMocks()
})

describe('PatientCardPanel', () => {
  it('gives a vet the clinical sections and the edit and delete actions', async () => {
    renderCard()

    expect(await screen.findByRole('dialog', { name: 'Record for Rex' })).toBeInTheDocument()
    for (const section of SECTIONS) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: '✎ Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('shows a client only the record, without clinical sections or actions', async () => {
    auth.role = 'client'
    renderCard()

    expect(await screen.findByRole('dialog', { name: 'Record for Rex' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basic information' })).toBeInTheDocument()
    for (const section of SECTIONS) {
      expect(screen.queryByRole('heading', { name: section })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: '✎ Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('opens the visit history in a centred window and returns to the record', async () => {
    const user = userEvent.setup()
    const onEditVisit = vi.fn()
    vi.mocked(examinationsApi.getPatientExaminations).mockResolvedValue([
      {
        id: 'e1',
        patientId: 'p1',
        performedByFirstName: 'Mira',
        performedByLastName: 'Vet',
        startedAt: '2026-09-17T07:00:00Z',
        diagnosis: 'otitis',
        isPaid: false,
        createdAt: '2026-09-17T07:30:00Z',
        attachments: [],
      },
    ])
    renderCard(onEditVisit)

    const record = await screen.findByRole('dialog', { name: 'Record for Rex' })
    expect(within(record).queryByRole('table')).not.toBeInTheDocument()
    await user.click(await within(record).findByRole('button', { name: 'Open visit history ›' }))

    const history = await screen.findByRole('dialog', { name: 'Visit history for Rex' })
    expect(within(history).getByText('Visit history · D26-04821')).toBeInTheDocument()
    await user.click(within(history).getByText('otitis'))
    const view = await screen.findByRole('dialog', { name: 'Visit of 17.09.2026' })
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Visit of 17.09.2026' })).not.toBeInTheDocument(),
    )
    expect(view).not.toBeInTheDocument()

    await user.click(within(history).getByText('otitis'))
    const reopened = await screen.findByRole('dialog', { name: 'Visit of 17.09.2026' })
    await user.click(within(reopened).getByRole('button', { name: '✎ Edit' }))
    expect(onEditVisit).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Visit of 17.09.2026' })).not.toBeInTheDocument(),
    )

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Visit history for Rex' }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('dialog', { name: 'Record for Rex' })).toBeInTheDocument()
  })
})
