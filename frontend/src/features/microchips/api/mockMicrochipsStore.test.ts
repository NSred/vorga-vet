import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import type { RegisterMicrochipRequest } from '../types'
import {
  lastClinic,
  listPatientRegistrations,
  MICROCHIPS_STORAGE_KEY,
  registerMicrochip,
  resetMicrochipsStore,
} from './mockMicrochipsStore'

const request: RegisterMicrochipRequest = {
  chipNumber: '688038000123459',
  implantedOn: '2026-10-05',
  sterilised: 'no',
  consentToPublish: true,
  animal: { name: 'Charlie', species: 'dog', breed: 'Beagle', sex: 'male', color: 'Tricolor' },
  owner: { name: 'Stefan Ilić', address: 'Cara Dušana 21', city: 'Niš', phone: '+381 60 567 8901' },
  lastRabies: { vaccineName: 'Nobivac Rabies', givenOn: '2026-10-01' },
  clinic: ' VorgaVet ',
  vetName: 'Dusan Vukovic',
}

function failure(action: () => unknown): ApiError | undefined {
  try {
    action()
  } catch (error) {
    return error as ApiError
  }
  return undefined
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T10:00:00Z'))
  resetMicrochipsStore()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('mock microchips store', () => {
  it('registers a chip with its snapshot and remembers the clinic', () => {
    registerMicrochip('p1', request)

    expect(listPatientRegistrations('p1')).toEqual([
      expect.objectContaining({
        chipNumber: '688038000123459',
        sterilised: 'no',
        consentToPublish: true,
        clinic: 'VorgaVet',
        lastRabies: { vaccineName: 'Nobivac Rabies', givenOn: '2026-10-01' },
      }),
    ])
    expect(lastClinic()).toEqual({ clinic: 'VorgaVet' })
  })

  it('refuses the same chip twice, spaces ignored, even for another patient', () => {
    registerMicrochip('p1', request)

    expect(
      failure(() => registerMicrochip('p2', { ...request, chipNumber: '688 038 000 123 459' }))
        ?.code,
    ).toBe('Microchips.AlreadyRegistered')
  })

  it('validates the chip, the date and the people', () => {
    const error = failure(() =>
      registerMicrochip('p1', {
        ...request,
        chipNumber: '123',
        implantedOn: '2026-10-06',
        sterilised: 'maybe' as RegisterMicrochipRequest['sterilised'],
        clinic: ' ',
      }),
    )

    expect(error?.validationMessages).toEqual([
      'Chip number must be 10 to 20 digits.',
      'Implanted on cannot be in the future.',
      'Sterilised must be yes, no or unknown.',
      'Clinic is required.',
    ])
  })

  it('never stores a JMBG sent by mistake', () => {
    const withJmbg = {
      ...request,
      jmbg: '0101990710008',
      owner: { ...request.owner, jmbg: '0101990710008' },
    } as RegisterMicrochipRequest

    registerMicrochip('p1', withJmbg)

    expect(window.localStorage.getItem(MICROCHIPS_STORAGE_KEY)).not.toContain('0101990710008')
    expect(JSON.stringify(listPatientRegistrations('p1'))).not.toContain('0101990710008')
  })
})
