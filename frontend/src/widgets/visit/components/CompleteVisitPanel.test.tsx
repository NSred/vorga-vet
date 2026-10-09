import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import * as ownersApi from '@/features/patients/api/ownersApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import type { Appointment } from '@/features/appointments'
import { resetChargesStore, getCharges } from '@/features/priceList/api/mockChargesStore'
import { resetPriceListStore } from '@/features/priceList/api/mockPriceListStore'
import {
  listPatientVaccinations,
  resetVaccinationsStore,
} from '@/features/vaccinations/api/mockVaccinationsStore'
import { addClinicDays, clinicToday } from '@/shared/lib/clinicTime'
import { typeDiagnosis } from '@/test/diagnosisPicking'
import { pickFromPriceList } from '@/test/priceListPicking'
import { CompleteVisitPanel } from './CompleteVisitPanel'

const profile = vi.hoisted(() => ({
  data: { id: 'u1', firstName: 'Mira', lastName: 'Vet', email: 'v@x.com' } as
    { id: string; firstName: string; lastName: string; email: string } | undefined,
}))

vi.mock('@/features/auth', () => ({
  useCurrentUser: () => ({ data: profile.data }),
}))

const full: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: 'o1',
  patientId: 'p1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'checked_in',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

const thin: Appointment = {
  ...full,
  patientId: undefined,
  patientName: undefined,
  status: 'scheduled',
}

function renderPanel(appointment: Appointment) {
  const props = { onOpenChange: vi.fn(), onRecorded: vi.fn(), onPaid: vi.fn(), onFailed: vi.fn() }
  render(<CompleteVisitPanel appointment={appointment} open {...props} />)

  return props
}

let completeSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  resetPriceListStore()
  resetChargesStore()
  resetVaccinationsStore()
  vi.spyOn(examinationsApi, 'getExamination').mockResolvedValue({
    id: 'e1',
    patientId: 'p1',
    performedByFirstName: 'Mira',
    performedByLastName: 'Vet',
    startedAt: new Date().toISOString(),
    isPaid: false,
    createdAt: new Date().toISOString(),
    attachments: [],
  })
  completeSpy = vi.spyOn(appointmentsApi, 'completeAppointment').mockResolvedValue('e1')
  vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])
  vi.spyOn(patientsApi, 'getPatient').mockResolvedValue({
    id: 'p1',
    cardNumber: 'C26-1',
    name: 'Luna',
    species: 'cat',
    breedName: 'Chartreux',
    sex: 'female',
    isDeleted: false,
    ownerId: 'o1',
    breedId: 'b1',
    ownerName: 'Ana Petrović',
    phoneNumber: '062/8890021',
    city: 'Novi Sad',
    createdAt: '2026-08-27',
    allergies: [{ id: 'al1', name: 'Penicillin' }],
  })
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
  profile.data = { id: 'u1', firstName: 'Mira', lastName: 'Vet', email: 'v@x.com' }
})

describe('CompleteVisitPanel', () => {
  it('shows the patient record header once the patient loads', async () => {
    renderPanel(full)

    const dialog = screen.getByRole('dialog', { name: 'Complete visit · Luna · Ana Petrović' })
    expect(await within(dialog).findByText('Complete visit · C26-1')).toBeInTheDocument()
    expect(within(dialog).getByText('Chartreux · —')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('link', { name: 'Call Ana Petrović, 062/8890021' }),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('⚠ Penicillin')).toBeInTheDocument()
    expect(within(dialog).queryByText('● Active')).not.toBeInTheDocument()
    expect(
      within(dialog).getByText('Record what happened at the visit. This closes the appointment.'),
    ).toBeInTheDocument()
  })

  it('keeps the plain title while the patient is loading', () => {
    renderPanel(full)

    const dialog = screen.getByRole('dialog', { name: 'Complete visit · Luna · Ana Petrović' })
    expect(within(dialog).getByText('Luna')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        'Ana Petrović. Record what happened at the visit. This closes the appointment.',
      ),
    ).toBeInTheDocument()
  })

  it('marks the chip as a new patient when the appointment has none yet', () => {
    const getPatient = vi.mocked(patientsApi.getPatient)
    renderPanel(thin)

    expect(getPatient).not.toHaveBeenCalled()

    expect(screen.getByRole('dialog', { name: /^Complete visit/ })).toBeInTheDocument()
    expect(screen.getByText('New patient')).toBeInTheDocument()
  })

  it('prefills the performer, records the charges total as the cost and keeps the lines', async () => {
    const user = userEvent.setup()
    const props = renderPanel(full)

    expect((screen.getByLabelText('Performed by, first name *') as HTMLInputElement).value).toBe(
      'Mira',
    )
    await typeDiagnosis(user, 'otitis')
    await pickFromPriceList(user, 'Add service', 'Klinički pregled')
    await pickFromPriceList(user, 'Add medication', 'Synulox')
    await user.clear(screen.getByLabelText('Quantity of Synulox'))
    await user.type(screen.getByLabelText('Quantity of Synulox'), '2')
    expect(screen.getByTestId('charges-total')).toHaveTextContent('1.800,00 RSD')
    await user.click(screen.getByRole('button', { name: 'Record visit' }))

    await waitFor(() =>
      expect(completeSpy).toHaveBeenCalledWith('a1', {
        examination: {
          performedByFirstName: 'Mira',
          performedByLastName: 'Vet',
          anamnesis: undefined,
          diagnosis: 'otitis',
          therapy: undefined,
          cost: 1800,
        },
      }),
    )
    expect(props.onRecorded).toHaveBeenCalledWith('e1')
    await waitFor(() =>
      expect(getCharges('e1').lines.map((line) => [line.name, line.quantity])).toEqual([
        ['Klinički pregled', 1],
        ['Synulox', 2],
      ]),
    )
    expect(await screen.findByRole('button', { name: 'Mark as paid' })).toBeInTheDocument()
  })

  it('offers no pay button when no cost was entered', async () => {
    const user = userEvent.setup()
    renderPanel(full)

    await user.click(screen.getByRole('button', { name: 'Record visit' }))

    expect(await screen.findByText('Recorded')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as paid' })).not.toBeInTheDocument()
  })

  it('marks the examination as paid and treats already-paid softly', async () => {
    const paySpy = vi
      .spyOn(examinationsApi, 'payExamination')
      .mockRejectedValueOnce(new ApiError(400, 'x', 'Examinations.AlreadyPaid'))
    const user = userEvent.setup()
    const props = renderPanel(full)

    await pickFromPriceList(user, 'Add service', 'Obrada rane')
    await user.click(screen.getByRole('button', { name: 'Record visit' }))
    await user.click(await screen.findByRole('button', { name: 'Mark as paid' }))

    expect(await screen.findByText('Already marked as paid.')).toBeInTheDocument()
    expect(paySpy).toHaveBeenCalledWith('e1')
    expect(props.onPaid).not.toHaveBeenCalled()
  })

  it('includes the resolution for a thin booking', async () => {
    const user = userEvent.setup()
    renderPanel(thin)

    await user.click(screen.getByRole('button', { name: /^Patient/ }))
    await user.click(await screen.findByText('Luna · Ana Petrović'))
    await user.click(screen.getByRole('button', { name: 'Record visit' }))

    await waitFor(() =>
      expect(completeSpy).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({ patient: { existingPatientId: 'p1' } }),
      ),
    )
  })

  it('hands an already recorded examination back to the page', async () => {
    completeSpy.mockRejectedValue(
      new ApiError(409, 'x', 'Examinations.AppointmentAlreadyHasExamination'),
    )
    const user = userEvent.setup()
    const props = renderPanel(full)

    await user.click(screen.getByRole('button', { name: 'Record visit' }))

    await waitFor(() => expect(props.onFailed).toHaveBeenCalled())
  })

  it('starts empty when the profile is unavailable', () => {
    profile.data = undefined
    renderPanel(full)

    expect((screen.getByLabelText('Performed by, first name *') as HTMLInputElement).value).toBe('')
  })

  it('records a vaccine line as a vaccination due when the vaccine says', async () => {
    const user = userEvent.setup()
    renderPanel(full)

    await pickFromPriceList(user, 'Add medication', 'Nobivac Rabies')
    await user.type(screen.getByLabelText('Batch of Nobivac Rabies'), 'A3KZ')
    await user.click(screen.getByRole('button', { name: 'Record visit' }))

    await waitFor(() =>
      expect(listPatientVaccinations('p1')).toEqual([
        expect.objectContaining({
          vaccineName: 'Nobivac Rabies',
          isRabies: true,
          batch: 'A3KZ',
          givenOn: clinicToday(),
          dueOn: addClinicDays(clinicToday(), 365),
          examinationId: 'e1',
          source: 'exam',
        }),
      ]),
    )
  })
})
