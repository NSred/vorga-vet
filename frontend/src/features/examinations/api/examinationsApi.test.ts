import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createExamination,
  deleteAttachment,
  getAttachmentBlob,
  getExamination,
  getPatientExaminations,
  payExamination,
  updateExamination,
  uploadAttachment,
} from './examinationsApi'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function lastCall(spy: ReturnType<typeof vi.spyOn>) {
  const [url, init] = spy.mock.calls[0] as [string, RequestInit]
  return {
    url: String(url),
    method: init.method,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('examinationsApi', () => {
  it('getExamination maps the response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'e1',
        patientId: 'p1',
        patientName: 'Luna',
        appointmentId: null,
        performedByFirstName: 'Mira',
        performedByLastName: 'Vet',
        startedAt: '2026-09-17T07:00:00Z',
        endedAt: null,
        anamnesis: null,
        diagnosis: 'otitis',
        therapy: null,
        cost: 45.5,
        isPaid: false,
        paidAt: null,
        createdAt: '2026-09-17T07:30:00Z',
        attachments: [],
      }),
    )

    const examination = await getExamination('e1')

    expect(lastCall(fetchSpy).url).toContain('/examinations/e1')
    expect(examination.appointmentId).toBeUndefined()
    expect(examination.diagnosis).toBe('otitis')
    expect(examination.cost).toBe(45.5)
  })

  it('createExamination posts the patient and the details', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse('e9'))
    const request = {
      patientId: 'p1',
      examination: { performedByFirstName: 'Mira', performedByLastName: 'Vet', cost: 10 },
    }

    await expect(createExamination(request)).resolves.toBe('e9')

    const call = lastCall(fetchSpy)
    expect(call.url.endsWith('/examinations')).toBe(true)
    expect(call.method).toBe('POST')
    expect(call.body).toEqual(request)
  })

  it('payExamination posts to the pay route', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))

    await payExamination('e1')

    const call = lastCall(fetchSpy)
    expect(call.url).toContain('/examinations/e1/pay')
    expect(call.method).toBe('POST')
  })
})

const listDto = {
  id: 'e1',
  patientId: 'p1',
  patientName: 'Luna',
  appointmentId: null,
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  endedAt: null,
  anamnesis: null,
  diagnosis: null,
  therapy: null,
  cost: null,
  isPaid: false,
  paidAt: null,
  createdAt: '2026-09-17T07:30:00Z',
  attachments: [],
}

describe('getPatientExaminations', () => {
  it('requests the patient route and maps the list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([listDto]))

    const examinations = await getPatientExaminations('p1')

    expect(lastCall(fetchSpy).url).toContain('/patients/p1/examinations')
    expect(examinations).toHaveLength(1)
    expect(examinations[0].patientName).toBe('Luna')
  })
})

describe('updateExamination', () => {
  it('puts the details under an examination key', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))
    const examination = { performedByFirstName: 'Mira', performedByLastName: 'Vet', cost: 20 }

    await updateExamination('e1', examination)

    const call = lastCall(fetchSpy)
    expect(call.url).toContain('/examinations/e1')
    expect(call.method).toBe('PUT')
    expect(call.body).toEqual({ examination })
  })
})

describe('uploadAttachment', () => {
  it('posts the file and the numeric kind as multipart', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse('att1'))
    const file = new File(['bytes'], 'scan.png', { type: 'image/png' })

    await expect(uploadAttachment('e1', file, 'ultrasound')).resolves.toBe('att1')

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(String(url)).toContain('/examinations/e1/attachments')
    expect(init.method).toBe('POST')
    const body = init.body as FormData
    expect(body.get('kind')).toBe('1')
    expect((body.get('file') as File).name).toBe('scan.png')
  })

  it('sends kind 0 for an x-ray', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse('att2'))

    await uploadAttachment('e1', new File(['b'], 'x.png', { type: 'image/png' }), 'xray')

    const body = (fetchSpy.mock.calls[0][1] as RequestInit).body as FormData
    expect(body.get('kind')).toBe('0')
  })
})

describe('deleteAttachment', () => {
  it('deletes under the examination', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))

    await deleteAttachment('e1', 'att1')

    const call = lastCall(fetchSpy)
    expect(call.url).toContain('/examinations/e1/attachments/att1')
    expect(call.method).toBe('DELETE')
  })
})

describe('getAttachmentBlob', () => {
  it('fetches the image bytes', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('bytes', { status: 200, headers: { 'Content-Type': 'image/png' } }),
      )

    const blob = await getAttachmentBlob('att1')

    expect(String(fetchSpy.mock.calls[0][0])).toContain('/attachments/att1')
    expect(blob.type).toBe('image/png')
  })
})
