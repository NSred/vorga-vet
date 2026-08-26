import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PatientCreatePanel } from './PatientCreatePanel'
import * as allergensApi from '../api/allergensApi'
import * as breedsApi from '../api/breedsApi'
import * as ownersApi from '../api/ownersApi'
import * as patientsApi from '../api/patientsApi'
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
  await screen.findByRole('option', { name: 'Cat' })
  await user.keyboard('{ArrowDown}{Enter}')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientCreatePanel', () => {
  it('prefills a card number matching the species letter format', () => {
    stubLookups()
    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    expect(cardNumberInput().value).toMatch(/^D\d{2}-\d{5}$/)
  })

  it('regenerates the card number when species changes', async () => {
    const user = userEvent.setup()
    stubLookups()
    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCatSpecies(user)

    await waitFor(() => {
      expect(cardNumberInput().value).toMatch(/^C\d{2}-\d{5}$/)
    })
  })

  it('does not regenerate the card number once the user has edited it', async () => {
    const user = userEvent.setup()
    stubLookups()
    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

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

    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

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

    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

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

    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={onCreated} />)

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

    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={onCreated} />)

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

    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={onCreated} />)

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

    render(<PatientCreatePanel open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

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

    render(<PatientCreatePanel open onOpenChange={onOpenChange} onCreated={vi.fn()} />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText('Animal name *')).toHaveValue('Bela')
  })
})
