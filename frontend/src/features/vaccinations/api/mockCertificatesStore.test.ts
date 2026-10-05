import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import type { IssueCertificateRequest } from '../types'
import {
  CERTIFICATES_STORAGE_KEY,
  getCertificateForVaccination,
  issueCertificate,
  lastIssuer,
  listPatientCertificates,
  resetCertificatesStore,
} from './mockCertificatesStore'
import { addManualVaccination, resetVaccinationsStore } from './mockVaccinationsStore'

const request: IssueCertificateRequest = {
  number: ' P3989553 ',
  issuedOn: '2026-10-05',
  animal: {
    name: 'Charlie',
    species: 'dog',
    breed: 'Beagle',
    sex: 'male',
    chipNumber: '688038000123459',
  },
  owner: { name: 'Stefan Ilić', address: 'Cara Dušana 21', city: 'Niš', phone: '+381 60 567 8901' },
  passportNumber: 'RS 81331825',
  passportIssuedOn: '2025-03-01',
  chipImplantedOn: '2025-03-01',
  issuedBy: 'VorgaVet',
  vetName: 'Dusan Vukovic',
  vetLicence: '2044',
}

function failure(action: () => unknown): ApiError | undefined {
  try {
    action()
  } catch (error) {
    return error as ApiError
  }
  return undefined
}

let rabies: string
let combined: string

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T10:00:00Z'))
  resetVaccinationsStore()
  resetCertificatesStore()
  rabies = addManualVaccination('p1', {
    vaccineName: 'Nobivac Rabies',
    isRabies: true,
    batch: 'A3KZ',
    givenOn: '2026-10-01',
    dueOn: '2027-10-01',
  })
  combined = addManualVaccination('p1', {
    vaccineName: 'Vanguard Plus 7',
    isRabies: false,
    givenOn: '2026-10-01',
    dueOn: '2027-10-01',
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('mock certificates store', () => {
  it('issues a certificate with the vaccination copied in and the subject as given', () => {
    issueCertificate(rabies, request)

    expect(getCertificateForVaccination(rabies)).toMatchObject({
      patientId: 'p1',
      number: 'P3989553',
      vaccineName: 'Nobivac Rabies',
      batch: 'A3KZ',
      givenOn: '2026-10-01',
      validUntil: '2027-10-01',
      animal: { name: 'Charlie', breed: 'Beagle' },
      owner: { city: 'Niš' },
      passportNumber: 'RS 81331825',
      vetLicence: '2044',
    })
    expect(listPatientCertificates('p1')).toHaveLength(1)
  })

  it('refuses a vaccination that is not rabies, a second certificate and a used number', () => {
    expect(failure(() => issueCertificate(combined, request))?.code).toBe('Certificates.NotRabies')
    expect(failure(() => issueCertificate('missing', request))?.code).toBe('Vaccinations.NotFound')

    issueCertificate(rabies, request)
    expect(failure(() => issueCertificate(rabies, request))?.code).toBe(
      'Certificates.AlreadyIssued',
    )

    const another = addManualVaccination('p2', {
      vaccineName: 'Rabigen Mono',
      isRabies: true,
      givenOn: '2026-10-02',
      dueOn: '2027-10-02',
    })
    expect(failure(() => issueCertificate(another, { ...request, number: 'p3989553' }))?.code).toBe(
      'Certificates.NumberNotUnique',
    )
  })

  it('validates the number, the dates and the issuer', () => {
    const error = failure(() =>
      issueCertificate(rabies, {
        ...request,
        number: ' ',
        issuedOn: '2026-09-30',
        passportIssuedOn: '2026-10-06',
        issuedBy: '',
        vetLicence: 'x'.repeat(31),
      }),
    )

    expect(error?.code).toBe('Validation.General')
    expect(error?.validationMessages).toEqual([
      'Certificate number is required.',
      'Issued on must be between the vaccination and today.',
      'Passport issued on cannot be in the future.',
      'Issued by is required.',
      'Licence number is too long.',
    ])
  })

  it('remembers the last issuer and licence', () => {
    expect(lastIssuer()).toEqual({})
    issueCertificate(rabies, request)
    expect(lastIssuer()).toEqual({ issuedBy: 'VorgaVet', vetLicence: '2044' })
  })

  it('keeps the subject as issued and reads it back after a reload', async () => {
    issueCertificate(rabies, request)
    expect(window.localStorage.getItem(CERTIFICATES_STORAGE_KEY)).toContain('P3989553')

    vi.resetModules()
    const reloaded = await import('./mockCertificatesStore')

    expect(reloaded.getCertificateForVaccination(rabies).owner.address).toBe('Cara Dušana 21')
  })
})
