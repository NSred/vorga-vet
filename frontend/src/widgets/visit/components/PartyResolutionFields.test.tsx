import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as breedsApi from '@/features/patients/api/breedsApi'
import * as ownersApi from '@/features/patients/api/ownersApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import { emptyResolution, type ResolutionNeeds, type ResolutionValues } from '../lib/resolution'
import { PartyResolutionFields } from './PartyResolutionFields'

function Harness({
  needs,
  onChange,
}: {
  needs: ResolutionNeeds
  onChange: (value: ResolutionValues) => void
}) {
  const [value, setValue] = useState(emptyResolution)

  return (
    <PartyResolutionFields
      needs={needs}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

function stubLookups() {
  vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])
  vi.spyOn(breedsApi, 'searchBreeds').mockResolvedValue([{ id: 'b1', name: 'Pug' }])
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
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PartyResolutionFields', () => {
  it('shows only the sections for the missing parties', () => {
    stubLookups()
    render(<Harness needs={{ owner: false, patient: true }} onChange={vi.fn()} />)

    expect(screen.queryByRole('heading', { name: 'Owner' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeInTheDocument()
  })

  it('picks an existing patient', async () => {
    stubLookups()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness needs={{ owner: false, patient: true }} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Patient/ }))
    await user.click(await screen.findByText('Luna · Ana Petrović'))

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        patientMode: 'existing',
        patient: expect.objectContaining({ id: 'p1' }),
      }),
    )
  })

  it('switches to a new card, generates a number and regenerates it when the species changes', async () => {
    stubLookups()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness needs={{ owner: false, patient: true }} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'New card' }))

    const cardNumber = screen.getByLabelText('No. *') as HTMLInputElement
    expect(cardNumber.value).toMatch(/^D\d{2}-\d{5}$/)

    await user.click(screen.getByRole('combobox', { name: 'Species' }))
    await user.click(await screen.findByRole('option', { name: 'Cat' }))

    expect((screen.getByLabelText('No. *') as HTMLInputElement).value).toMatch(/^C\d{2}-\d{5}$/)

    await user.type(screen.getByLabelText('Animal name *'), 'Mica')
    await user.click(screen.getByRole('button', { name: /Breed/ }))
    await user.click(await screen.findByText('Pug'))

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        patientMode: 'new',
        newPatient: expect.objectContaining({
          species: 'cat',
          name: 'Mica',
          breed: { id: 'b1', name: 'Pug' },
        }),
      }),
    )
  })
})
