import { describe, expect, it } from 'vitest'
import type { Examination } from '../types'
import { hasCharge, isUnpaid, performerOf, visitOrigin } from './visitLabels'

const visit: Examination = {
  id: 'e1',
  patientId: 'p1',
  appointmentId: 'a1',
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  cost: 1500,
  isPaid: false,
  createdAt: '2026-09-17T07:30:00Z',
  attachments: [],
}

describe('visit labels', () => {
  it('owes money only for a cost above zero that is not paid', () => {
    expect(isUnpaid(visit)).toBe(true)
    expect(isUnpaid({ ...visit, isPaid: true })).toBe(false)
    expect(isUnpaid({ ...visit, cost: 0 })).toBe(false)
    expect(isUnpaid({ ...visit, cost: undefined })).toBe(false)
  })

  it('treats a zero cost like no cost', () => {
    expect(hasCharge({ ...visit, cost: 0 })).toBe(false)
    expect(hasCharge({ ...visit, cost: undefined })).toBe(false)
    expect(hasCharge(visit)).toBe(true)
  })

  it('names the vet and where the visit came from', () => {
    expect(performerOf(visit)).toBe('Mira Vet')
    expect(visitOrigin(visit)).toBe('Appointment')
    expect(visitOrigin({ ...visit, appointmentId: undefined })).toBe('Walk-in')
  })
})
