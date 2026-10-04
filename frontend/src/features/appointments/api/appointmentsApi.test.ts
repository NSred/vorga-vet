import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  createAppointment,
  getAppointment,
  getAppointments,
  getAvailability,
  getUnresolvedAppointments,
  markNoShow,
  rescheduleAppointment,
} from './appointmentsApi'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const range = { from: '2026-09-16T22:00:00.000Z', to: '2026-09-17T22:00:00.000Z' }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getAppointments', () => {
  it('requests the range and maps the response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([
        {
          id: 'a1',
          createdByUserId: 'u1',
          ownerId: 'o1',
          patientId: null,
          startsAt: '2026-09-17T07:00:00Z',
          endsAt: '2026-09-17T07:30:00Z',
          durationMinutes: 30,
          type: 3,
          status: 1,
          reason: 'limping',
          ownerName: 'Ana Petrović',
          patientName: null,
          createdAt: '2026-09-10T10:00:00Z',
        },
      ]),
    )

    const appointments = await getAppointments(range)

    const url = String(fetchSpy.mock.calls[0][0])
    expect(url).toContain(`from=${encodeURIComponent(range.from)}`)
    expect(url).toContain(`to=${encodeURIComponent(range.to)}`)
    expect(appointments[0].type).toBe('surgery')
    expect(appointments[0].status).toBe('checked_in')
    expect(appointments[0].patientId).toBeUndefined()
  })
})

describe('getAvailability', () => {
  it('requests the availability endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([
        {
          startsAt: '2026-09-17T05:00:00Z',
          endsAt: '2026-09-17T05:30:00Z',
          isAvailable: true,
          isMine: false,
        },
      ]),
    )

    const slots = await getAvailability(range)

    expect(String(fetchSpy.mock.calls[0][0])).toContain('/appointments/availability?')
    expect(slots).toHaveLength(1)
    expect(slots[0].isAvailable).toBe(true)
  })
})

describe('getAvailability duration', () => {
  it('omits durationMinutes by default', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([]))

    await getAvailability(range)

    expect(String(fetchSpy.mock.calls[0][0])).not.toContain('durationMinutes')
  })

  it('sends durationMinutes when given', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([]))

    await getAvailability(range, 90)

    expect(String(fetchSpy.mock.calls[0][0])).toContain('durationMinutes=90')
  })
})

const dto = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: null,
  patientId: null,
  startsAt: '2026-09-17T07:00:00Z',
  endsAt: '2026-09-17T07:30:00Z',
  durationMinutes: 30,
  type: 1,
  status: 0,
  reason: null,
  ownerName: null,
  patientName: null,
  createdAt: '2026-09-10T10:00:00Z',
}

function lastCall(spy: ReturnType<typeof vi.spyOn>) {
  const [url, init] = spy.mock.calls[0] as [string, RequestInit]
  return {
    url: String(url),
    method: init.method,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  }
}

describe('appointment reads', () => {
  it('getAppointment maps a single appointment', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(dto))

    const appointment = await getAppointment('a1')

    expect(lastCall(fetchSpy).url).toContain('/appointments/a1')
    expect(appointment.type).toBe('checkup')
  })

  it('getUnresolvedAppointments maps the list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([dto]))

    const appointments = await getUnresolvedAppointments()

    expect(lastCall(fetchSpy).url).toContain('/appointments/unresolved')
    expect(appointments).toHaveLength(1)
  })
})

describe('appointment writes', () => {
  it('createAppointment posts the request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse('a9'))
    const request = { startsAt: '2026-09-17T07:00:00.000Z', durationMinutes: 30, type: 1 }

    await expect(createAppointment(request)).resolves.toBe('a9')

    const call = lastCall(fetchSpy)
    expect(call.url.endsWith('/appointments')).toBe(true)
    expect(call.method).toBe('POST')
    expect(call.body).toEqual(request)
  })

  it('rescheduleAppointment posts to the reschedule route', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))

    await rescheduleAppointment('a1', { startsAt: '2026-09-17T08:00:00.000Z' })

    const call = lastCall(fetchSpy)
    expect(call.url).toContain('/appointments/a1/reschedule')
    expect(call.body).toEqual({ startsAt: '2026-09-17T08:00:00.000Z' })
  })

  it('cancelAppointment sends the reason and drops an empty one', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))

    await cancelAppointment('a1', 'owner called')
    await cancelAppointment('a1', '')

    expect(lastCall(fetchSpy).url).toContain('/appointments/a1/cancel')
    expect(JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body))).toEqual({
      reason: 'owner called',
    })
    expect(JSON.parse(String((fetchSpy.mock.calls[1][1] as RequestInit).body))).toEqual({})
  })

  it('markNoShow posts to the no-show route', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))

    await markNoShow('a1', 'no answer')

    const call = lastCall(fetchSpy)
    expect(call.url).toContain('/appointments/a1/no-show')
    expect(call.body).toEqual({ note: 'no answer' })
  })
})

describe('visit writes', () => {
  it('checkInAppointment posts the resolution and returns the parties', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ownerId: 'o1', patientId: 'p1' }))
    const request = { patient: { existingPatientId: 'p1' } }

    await expect(checkInAppointment('a1', request)).resolves.toEqual({
      ownerId: 'o1',
      patientId: 'p1',
    })

    const call = lastCall(fetchSpy)
    expect(call.url).toContain('/appointments/a1/check-in')
    expect(call.body).toEqual(request)
  })

  it('completeAppointment posts the examination and returns its id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse('e1'))
    const request = {
      examination: { performedByFirstName: 'Mira', performedByLastName: 'Vet' },
    }

    await expect(completeAppointment('a1', request)).resolves.toBe('e1')

    const call = lastCall(fetchSpy)
    expect(call.url).toContain('/appointments/a1/complete')
    expect(call.body).toEqual(request)
  })
})
