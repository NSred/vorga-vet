import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { PatientFormPanel } from './PatientFormPanel'
import * as allergensApi from '../api/allergensApi'
import * as breedsApi from '../api/breedsApi'
import * as ownersApi from '../api/ownersApi'
import * as patientsApi from '../api/patientsApi'
import type { PatientDetail } from '../types'
import { ApiError } from '@/shared/lib/apiClient'

function stubLookups() {
  vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([
    { id: 'owner-1', firstName: 'Vladimir', lastName: 'Subić', phoneNumber: '060/7301103' },
  ])
  vi.spyOn(breedsApi, 'searchBreeds').mockResolvedValue([{ id: 'breed-1', name: 'Pug' }])
  vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Animal name *'), 'Bela')

  await user.click(screen.getByRole('button', { name: /Owner/ }))
  await user.click(await screen.findByRole('option', { name: /Subić Vladimir/ }))

  await user.click(screen.getByRole('button', { name: /Breed/ }))
  await user.click(await screen.findByRole('option', { name: /Pug/ }))
}

function cardNumberInput(): HTMLInputElement {
  return screen.getByLabelText('No. *') as HTMLInputElement
}

async function selectCatSpecies(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Species' }))
  await user.click(await screen.findByRole('option', { name: 'Cat' }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientFormPanel', () => {
  it('prefills a card number matching the species letter format', () => {
    stubLookups()
    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    expect(cardNumberInput().value).toMatch(/^D\d{2}-\d{5}$/)
  })

  it('regenerates the card number when species changes', async () => {
    const user = userEvent.setup()
    stubLookups()
    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await selectCatSpecies(user)

    await waitFor(() => {
      expect(cardNumberInput().value).toMatch(/^C\d{2}-\d{5}$/)
    })
  })

  it('does not regenerate the card number once the user has edited it', async () => {
    const user = userEvent.setup()
    stubLookups()
    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await user.clear(cardNumberInput())
    await user.type(cardNumberInput(), 'MANUAL-1')

    await selectCatSpecies(user)

    expect(cardNumberInput().value).toBe('MANUAL-1')
  })

  it('does not submit the patient form when a nested create dialog is submitted', async () => {
    const user = userEvent.setup()
    stubLookups()
    vi.spyOn(ownersApi, 'createOwner').mockResolvedValue('owner-9')
    const createSpy = vi.spyOn(patientsApi, 'createPatient').mockResolvedValue('id')

    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.type(screen.getByLabelText('Search Owner *'), 'Petrović')
    await user.click(await screen.findByText(/Create owner/))

    await user.type(screen.getByLabelText('First name *'), 'Ana')
    await user.type(screen.getByLabelText('Last name *'), 'Petrović')
    await user.type(screen.getByLabelText('Phone *'), '062/8890021')
    await user.type(screen.getByLabelText('Address *'), 'Zmaj Jovina 4')
    await user.type(screen.getByLabelText('City *'), 'Novi Sad')
    await user.click(screen.getByRole('button', { name: 'Create owner' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Owner/ })).toHaveTextContent('Petrović Ana'),
    )
    expect(createSpy).not.toHaveBeenCalled()
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('blocks submit until owner and breed are chosen', async () => {
    const user = userEvent.setup()
    stubLookups()
    const createSpy = vi.spyOn(patientsApi, 'createPatient').mockResolvedValue('id')

    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await user.type(screen.getByLabelText('Animal name *'), 'Bela')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Owner is required')).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('submits the mapped request and reports the created name', async () => {
    const user = userEvent.setup()
    stubLookups()
    const createSpy = vi.spyOn(patientsApi, 'createPatient').mockResolvedValue('new-id')
    const onCreated = vi.fn()

    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={onCreated}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1))
    const request = createSpy.mock.calls[0][0]
    expect(request.ownerId).toBe('owner-1')
    expect(request.breedId).toBe('breed-1')
    expect(request.name).toBe('Bela')
    expect(onCreated).toHaveBeenCalledWith('Bela')
  })

  it('regenerates and retries once on a duplicate card number', async () => {
    const user = userEvent.setup()
    stubLookups()
    const createSpy = vi
      .spyOn(patientsApi, 'createPatient')
      .mockRejectedValueOnce(new ApiError(409, 'taken', 'Patients.CardNumberNotUnique'))
      .mockResolvedValueOnce('new-id')
    const onCreated = vi.fn()

    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={onCreated}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(2))
    expect(createSpy.mock.calls[0][0].cardNumber).not.toBe(createSpy.mock.calls[1][0].cardNumber)
    expect(onCreated).toHaveBeenCalledWith('Bela')
  })

  it('shows a field error when the retry also collides', async () => {
    const user = userEvent.setup()
    stubLookups()
    vi.spyOn(patientsApi, 'createPatient').mockRejectedValue(
      new ApiError(409, 'taken', 'Patients.CardNumberNotUnique'),
    )
    const onCreated = vi.fn()

    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={onCreated}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/card number is already taken/i)).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('clears the owner when the backend says it no longer exists', async () => {
    const user = userEvent.setup()
    stubLookups()
    vi.spyOn(patientsApi, 'createPatient').mockRejectedValue(
      new ApiError(404, 'not found', 'Owners.NotFound'),
    )

    render(
      <PatientFormPanel
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/owner no longer exists/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Owner/ })).toHaveTextContent('Search owners…')
  })

  it('keeps the panel open and reports other failures', async () => {
    const user = userEvent.setup()
    stubLookups()
    vi.spyOn(patientsApi, 'createPatient').mockRejectedValue(new ApiError(500, 'Server exploded'))
    const onOpenChange = vi.fn()

    render(
      <PatientFormPanel
        open
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
        mode="create"
      />,
    )

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText('Animal name *')).toHaveValue('Bela')
  })
})

const detail: PatientDetail = {
  id: 'p1',
  cardNumber: 'C26-11111',
  name: 'Keti',
  species: 'cat',
  breedName: 'Chartreux',
  sex: 'female',
  birthDate: '2015-03-04',
  isDeleted: false,
  ownerName: 'Vladimir Subić',
  phoneNumber: '060/7301103',
  city: 'Novi Sad',
  ownerId: 'owner-1',
  breedId: 'breed-1',
  createdAt: '2026-08-27',
  allergies: [],
}

function renderEdit(overrides: Partial<Parameters<typeof PatientFormPanel>[0]> = {}) {
  return render(
    <PatientFormPanel
      mode="edit"
      patient={detail}
      open
      onOpenChange={vi.fn()}
      onSaved={vi.fn()}
      onMissing={vi.fn()}
      {...overrides}
    />,
  )
}

describe('PatientFormPanel in edit mode', () => {
  it('prefills the patient values instead of generating a card number', () => {
    stubLookups()

    renderEdit()

    expect(cardNumberInput().value).toBe('C26-11111')
    expect((screen.getByLabelText('Animal name *') as HTMLInputElement).value).toBe('Keti')
    expect(screen.getByRole('button', { name: /Owner/ })).toHaveTextContent('Subić Vladimir')
    expect(screen.getByRole('button', { name: /Breed/ })).toHaveTextContent('Chartreux')
  })

  it('never regenerates the card number when species changes', async () => {
    const user = userEvent.setup()
    stubLookups()

    renderEdit()

    await user.click(screen.getByRole('combobox', { name: 'Species' }))
    await user.click(await screen.findByRole('option', { name: 'Bird' }))

    await waitFor(() => {
      expect(cardNumberInput().value).toBe('C26-11111')
    })
  })

  it('puts the patient and reports the saved name', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    stubLookups()
    const updateSpy = vi.spyOn(patientsApi, 'updatePatient').mockResolvedValue(undefined)

    renderEdit({ onSaved })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ ownerId: 'owner-1', breedId: 'breed-1', sex: 1 }),
      )
    })
    expect(onSaved).toHaveBeenCalledWith('Keti')
  })

  it('shows a field error rather than retrying on a duplicate card number', async () => {
    const user = userEvent.setup()
    stubLookups()
    const updateSpy = vi
      .spyOn(patientsApi, 'updatePatient')
      .mockRejectedValue(new ApiError(409, 'taken', 'Patients.CardNumberNotUnique'))

    renderEdit()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument()
    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(cardNumberInput().value).toBe('C26-11111')
  })
})

describe('PatientFormPanel discard guard', () => {
  it('closes without prompting when nothing changed', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm')
    stubLookups()

    renderEdit({ onOpenChange })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('prompts and stays open when the user keeps editing', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    stubLookups()

    renderEdit({ onOpenChange })

    await user.type(screen.getByLabelText('Animal name *'), ' II')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
    expect((screen.getByLabelText('Animal name *') as HTMLInputElement).value).toBe('Keti II')
  })

  it('closes when the user confirms the discard', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubLookups()

    renderEdit({ onOpenChange })

    await user.type(screen.getByLabelText('Animal name *'), ' II')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('guards the ✕ close and Escape the same way as Cancel', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    stubLookups()

    renderEdit({ onOpenChange })

    await user.type(screen.getByLabelText('Animal name *'), ' II')
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('does not prompt in create mode', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm')
    stubLookups()

    render(
      <PatientFormPanel
        mode="create"
        open
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
        onMissing={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Animal name *'), 'Bela')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('focuses the card number field when the backend reports a conflict', async () => {
    const user = userEvent.setup()
    stubLookups()
    vi.spyOn(patientsApi, 'updatePatient').mockRejectedValue(
      new ApiError(409, 'taken', 'Patients.CardNumberNotUnique'),
    )

    renderEdit()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByText(/already taken/i)
    expect(cardNumberInput()).toHaveFocus()
  })
})
