import { describe, expect, it } from 'vitest'
import { attachmentKindFromApi, toExamination } from './examinationMapping'
import type { ExaminationDto } from '../types'

const dto: ExaminationDto = {
  id: 'e1',
  patientId: 'p1',
  patientName: null,
  appointmentId: 'a1',
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  endedAt: '2026-09-17T07:30:00Z',
  anamnesis: null,
  diagnosis: null,
  therapy: null,
  cost: null,
  isPaid: true,
  paidAt: '2026-09-17T07:35:00Z',
  createdAt: '2026-09-17T07:30:00Z',
  attachments: [
    {
      id: 'att1',
      kind: 1,
      fileName: 'scan.png',
      contentType: 'image/png',
      sizeBytes: 1024,
      uploadedAt: '2026-09-17T07:32:00Z',
    },
  ],
}

describe('toExamination', () => {
  it('maps nulls to undefined and attachments to kinds', () => {
    const examination = toExamination(dto)

    expect(examination.patientName).toBeUndefined()
    expect(examination.cost).toBeUndefined()
    expect(examination.appointmentId).toBe('a1')
    expect(examination.paidAt).toBe('2026-09-17T07:35:00Z')
    expect(examination.attachments[0].kind).toBe('ultrasound')
  })
})

describe('attachmentKindFromApi', () => {
  it('maps both kinds and rejects the rest', () => {
    expect(attachmentKindFromApi(0)).toBe('xray')
    expect(attachmentKindFromApi(1)).toBe('ultrasound')
    expect(() => attachmentKindFromApi(7)).toThrow(/kind/i)
  })
})
