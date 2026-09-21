import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAppointments, getAvailability } from './appointmentsApi'

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
