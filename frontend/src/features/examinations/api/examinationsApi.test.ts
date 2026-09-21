import { afterEach, describe, expect, it, vi } from 'vitest'
import { createExamination, getExamination, payExamination } from './examinationsApi'

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
