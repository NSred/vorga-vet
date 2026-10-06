import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { registerMicrochip, resetMicrochipsStore } from '../api/mockMicrochipsStore'
import type { RegistrationSubject } from '../types'
import { MicrochipSection } from './MicrochipSection'

const JMBG = '0101990710008'
const today = clinicToday()

const subject: RegistrationSubject = {
  chipNumber: '688038000123459',
  animal: {
    name: 'Charlie',
    species: 'dog',
    breed: 'Beagle',
    sex: 'male',
    birthDate: '2020-05-14',
    color: 'Tricolor',
  },
  owner: { name: 'Stefan Ilić', address: 'Cara Dušana 21', city: 'Niš', phone: '+381 60 567 8901' },
}

let printed: string | undefined

beforeEach(() => {
  resetMicrochipsStore()
  printed = undefined
  vi.spyOn(window, 'print').mockImplementation(() => {
    printed = document.querySelector('.print-root')?.textContent ?? undefined
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderSection(withSubject: RegistrationSubject = subject) {
  render(
    <MicrochipSection
      patientId="p1"
      subject={withSubject}
      lastRabies={{ vaccineName: 'Nobivac Rabies', givenOn: '2026-05-25' }}
      vetName="Dusan Vukovic"
    />,
  )
}

function storedEverywhere(): string {
  return Object.keys(window.localStorage)
    .map((key) => window.localStorage.getItem(key) ?? '')
    .join('\n')
}

describe('MicrochipSection', () => {
  it('asks for a chip number when the card has none', async () => {
    renderSection({ ...subject, chipNumber: undefined })

    expect(await screen.findByText(/No chip number on this card yet/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Register microchip' })).not.toBeInTheDocument()
  })

  it('prefills the form and checks the JMBG', async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: 'Register microchip' }))
    const dialog = await screen.findByRole('dialog', { name: 'Register microchip' })
    expect(dialog).toHaveTextContent('Charlie · chip 688038000123459 · owner Stefan Ilić')
    expect(dialog).toHaveTextContent('Last rabies vaccination: Nobivac Rabies, 25.05.2026')
    expect(within(dialog).getByLabelText('Vet *')).toHaveValue('Dusan Vukovic')
    expect(within(dialog).getByLabelText('Clinic *')).toHaveValue('VorgaVet')

    await user.click(within(dialog).getByRole('button', { name: 'Register and print' }))
    expect(await within(dialog).findByText('Type the owner’s JMBG')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Owner’s JMBG *'), '0101990710009')
    await user.click(within(dialog).getByRole('button', { name: 'Register and print' }))
    expect(await within(dialog).findByText('This JMBG has a typing mistake')).toBeInTheDocument()
    expect(window.print).not.toHaveBeenCalled()
  })

  it('registers, prints the Serbian sheet with the JMBG and stores no JMBG', async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: 'Register microchip' }))
    const dialog = await screen.findByRole('dialog', { name: 'Register microchip' })
    await user.click(within(dialog).getByRole('button', { name: 'No' }))
    await user.click(
      within(dialog).getByLabelText('The owner consents to publishing the data online'),
    )
    await user.type(within(dialog).getByLabelText('Owner’s JMBG *'), JMBG)
    await user.click(within(dialog).getByRole('button', { name: 'Register and print' }))

    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
    for (const text of [
      'Prijava obeležavanja mikročipom',
      'Broj mikročipa: 688038000123459',
      'Ime i prezimeStefan Ilić',
      `JMBG${JMBG}`,
      'AdresaCara Dušana 21, Niš',
      'VrstaPas',
      'Polmuški',
      'Sterilisanne',
      `Datum ugradnje mikročipa${formatDisplayDate(today)}`,
      'VakcinaNobivac Rabies',
      'Saglasnost za objavljivanje podataka na internetuda',
      'Mikročip ugradio: Dusan Vukovic',
    ]) {
      expect(printed).toContain(text)
    }

    expect(await screen.findByText('Chip 688038000123459 was registered')).toBeInTheDocument()
    expect(storedEverywhere()).toContain('688038000123459')
    expect(storedEverywhere()).not.toContain(JMBG)
  })

  it('asks for the JMBG again before a reprint', async () => {
    registerMicrochip('p1', {
      chipNumber: '688038000123459',
      implantedOn: today,
      sterilised: 'yes',
      consentToPublish: false,
      animal: subject.animal,
      owner: subject.owner,
      clinic: 'VorgaVet',
      vetName: 'Dusan Vukovic',
    })
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: 'Print registration sheet' }))
    const prompt = await screen.findByRole('dialog', { name: 'Print registration sheet' })
    await user.click(within(prompt).getByRole('button', { name: 'Print' }))
    expect(await within(prompt).findByText('Type the owner’s JMBG')).toBeInTheDocument()

    await user.type(within(prompt).getByLabelText('Owner’s JMBG *'), '1505877800014')
    await user.click(within(prompt).getByRole('button', { name: 'Print' }))

    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
    expect(printed).toContain('JMBG1505877800014')
    expect(printed).toContain('Sterilisanda')
    expect(storedEverywhere()).not.toContain('1505877800014')
  })
})
