import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addClinicDays, clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { issueCertificate, resetCertificatesStore } from '../api/mockCertificatesStore'
import { addManualVaccination, resetVaccinationsStore } from '../api/mockVaccinationsStore'
import type { CertificateSubject } from '../types'
import { VaccinationsSection } from './VaccinationsSection'

const today = clinicToday()
const givenOn = addClinicDays(today, -2)

const subject: CertificateSubject = {
  animal: {
    name: 'Charlie',
    species: 'dog',
    breed: 'Beagle',
    sex: 'male',
    birthDate: '2020-05-14',
    color: 'Tricolor',
    chipNumber: '688038000123459',
  },
  owner: { name: 'Stefan Ilić', address: 'Cara Dušana 21', city: 'Niš', phone: '+381 60 567 8901' },
}

let printed: string | undefined

beforeEach(() => {
  resetVaccinationsStore()
  resetCertificatesStore()
  printed = undefined
  vi.spyOn(window, 'print').mockImplementation(() => {
    printed = document.querySelector('.print-root')?.textContent ?? undefined
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function emulatePhone() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function addRabies(name = 'Nobivac Rabies') {
  return addManualVaccination('p1', {
    vaccineName: name,
    isRabies: true,
    batch: 'A3KZ',
    givenOn,
    dueOn: addClinicDays(givenOn, 365),
  })
}

function renderSection(withSubject: CertificateSubject = subject) {
  return render(
    <VaccinationsSection patientId="p1" certificateSubject={withSubject} vetName="Dusan Vukovic" />,
  )
}

describe('rabies certificate', () => {
  it('offers a certificate only for rabies vaccinations', async () => {
    addRabies()
    addManualVaccination('p1', {
      vaccineName: 'Vanguard Plus 7',
      isRabies: false,
      givenOn,
      dueOn: addClinicDays(givenOn, 365),
    })
    renderSection()

    const list = await screen.findByRole('list', { name: 'Vaccinations' })
    expect(within(list).getAllByRole('button', { name: 'Certificate' })).toHaveLength(1)
  })

  it('issues without printing on a phone and keeps the reprint for later', async () => {
    emulatePhone()
    addRabies()
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: 'Certificate' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rabies vaccination certificate' })
    expect(
      within(dialog).queryByRole('button', { name: 'Issue and print' }),
    ).not.toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Certificate number *'), 'P3989553')
    await user.click(within(dialog).getByRole('button', { name: 'Issue certificate' }))

    expect(await screen.findByRole('button', { name: 'Print certificate' })).toBeInTheDocument()
    expect(window.print).not.toHaveBeenCalled()
  })

  it('prefills the form and asks for the form number', async () => {
    addRabies()
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: 'Certificate' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rabies vaccination certificate' })
    expect(within(dialog).getByLabelText('Vet *')).toHaveValue('Dusan Vukovic')
    expect(within(dialog).getByLabelText('Issued by *')).toHaveValue('VorgaVet')
    expect(dialog).toHaveTextContent('Charlie · Nobivac Rabies')
    expect(dialog).toHaveTextContent('batch A3KZ')

    await user.click(within(dialog).getByRole('button', { name: 'Issue and print' }))
    expect(
      await within(dialog).findByText('Type the number printed on the form'),
    ).toBeInTheDocument()
    expect(window.print).not.toHaveBeenCalled()
  })

  it('issues, prints the Serbian certificate and then offers a reprint', async () => {
    addRabies()
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: 'Certificate' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rabies vaccination certificate' })
    await user.type(within(dialog).getByLabelText('Certificate number *'), 'P3989553')
    await user.type(within(dialog).getByLabelText('Pet passport number'), 'RS 81331825')
    await user.type(within(dialog).getByLabelText('Licence number'), '2044')
    await user.click(within(dialog).getByRole('button', { name: 'Issue and print' }))

    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
    for (const text of [
      'Potvrda o vakcinaciji protiv besnila',
      'Broj potvrde: P3989553',
      'VrstaPas',
      'RasaBeagle',
      'Polmuški',
      'Datum rođenja14.05.2020',
      'Broj mikročipa688038000123459',
      'Broj pasošaRS 81331825',
      'Ime i prezimeStefan Ilić',
      'AdresaCara Dušana 21, Niš',
      'VakcinaNobivac Rabies',
      'SerijaA3KZ',
      `Datum vakcinacije${formatDisplayDate(givenOn)}`,
      `Važi do${formatDisplayDate(addClinicDays(givenOn, 365))}`,
      'Veterinar: Dusan Vukovic, broj licence 2044',
    ]) {
      expect(printed).toContain(text)
    }

    expect(await screen.findByText('Certificate P3989553 was issued')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Print certificate' }))
    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(2))
  })

  it('refuses a form number used before', async () => {
    const first = addRabies()
    issueCertificate(first, {
      number: 'P1',
      issuedOn: today,
      animal: subject.animal,
      owner: subject.owner,
      issuedBy: 'VorgaVet',
      vetName: 'Dusan Vukovic',
    })
    addRabies('Rabigen Mono')
    const user = userEvent.setup()
    renderSection()

    await user.click(await screen.findByRole('button', { name: 'Certificate' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rabies vaccination certificate' })
    await user.type(within(dialog).getByLabelText('Certificate number *'), 'p1')
    await user.click(within(dialog).getByRole('button', { name: 'Issue and print' }))

    expect(
      await within(dialog).findByText('This number was already used on another certificate'),
    ).toBeInTheDocument()
  })

  it('reprints what was issued even after the patient card changed', async () => {
    const id = addRabies()
    issueCertificate(id, {
      number: 'P2',
      issuedOn: today,
      animal: subject.animal,
      owner: subject.owner,
      issuedBy: 'VorgaVet',
      vetName: 'Dusan Vukovic',
    })
    const user = userEvent.setup()
    renderSection({ ...subject, owner: { ...subject.owner, city: 'Beograd' } })

    await user.click(await screen.findByRole('button', { name: 'Print certificate' }))

    await waitFor(() => expect(window.print).toHaveBeenCalled())
    expect(printed).toContain('Cara Dušana 21, Niš')
    expect(printed).not.toContain('Beograd')
  })
})
