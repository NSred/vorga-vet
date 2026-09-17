# Appointments Vet Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Appointments page off its in-memory mock onto the real backend endpoints, as a read-only vet calendar with clinic-timezone-correct day, week and month views.

**Architecture:** A single timezone-aware module (`shared/lib/clinicTime.ts`) converts between clinic date strings and UTC instants; every view requests exactly its visible range from `GET appointments` and `GET appointments/availability`. The appointments feature holds no patient data — the page composes it with a `PatientSummary` from the patients feature, keeping the "features never import features" rule. Clients are kept off the page entirely by a role guard.

**Tech Stack:** React 19, TypeScript, TanStack Query v5, date-fns v4 + `@date-fns/tz`, Vitest, Testing Library, CSS Modules, oxlint.

**Spec:** `docs/specs/2026-09-17-appointments-vet-calendar-design.md`

## Global Constraints

- Clinic timezone is `Europe/Belgrade` (`CLINIC_TIME_ZONE`), matching the backend's `Clinic:TimeZone`. Only `shared/lib/clinicTime.ts` may reference it.
- Slot size is 30 minutes; opening hours come from availability, never hard-coded.
- Backend enums: `AppointmentType` `FirstVisit=0`, `Checkup=1`, `BloodDraw=2`, `Surgery=3`. `AppointmentStatus` `Scheduled=0`, `CheckedIn=1`, `Completed=2`, `NoShow=3`, `Cancelled=4`.
- A range sent to the backend must satisfy `to > from` and span at most 62 days.
- Layering: `app -> pages -> widgets -> features -> shared`. Features never import other features.
- Optional API fields map to `undefined`, following `features/patients/lib/patientMapping.ts`.
- No code comments in source files (user preference).
- **Do not run `git commit`.** The user commits their own work. Each task ends with a green verification run instead.
- Verification commands, run from `frontend/`: `npx vitest run`, `npx tsc -b`, `npm run lint`.

---

### Task 1: Clinic time module

**Files:**
- Modify: `frontend/package.json` (add `@date-fns/tz`)
- Modify: `frontend/vite.config.ts` (pin the test timezone)
- Create: `frontend/src/shared/lib/clinicTime.ts`
- Test: `frontend/src/shared/lib/clinicTime.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `CLINIC_TIME_ZONE: string`; `clinicToday(): string`; `clinicDateOf(utcIso: string): string`; `clinicTimeOf(utcIso: string): string`; `clinicDayRange(dateIso: string): DateRange`; `clinicWeekRange(dateIso: string): DateRange`; `clinicMonthGridRange(dateIso: string): DateRange`; `clinicRecentDaysRange(days: number, endDateIso: string): DateRange`; `addClinicDays(dateIso: string, amount: number): string`; `addClinicWeeks(dateIso: string, amount: number): string`; `addClinicMonths(dateIso: string, amount: number): string`. `DateRange` is `{ from: string; to: string }` where both are UTC ISO strings (`toISOString()`).

- [ ] **Step 1: Install the timezone package**

Run in `frontend/`:

```bash
npm install @date-fns/tz
```

- [ ] **Step 2: Pin the test timezone**

In `frontend/vite.config.ts`, add `env` to the `test` block so tests never run in the clinic's own zone:

```ts
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { TZ: 'America/New_York' },
  },
```

Then confirm it took effect by running the existing suite and checking nothing breaks:

Run: `npx vitest run src/shared/lib`
Expected: PASS. If the setting has no effect on Windows (a test asserting `new Date().getTimezoneOffset()` would tell you), instead change the `test` script in `package.json` to `cross-env TZ=America/New_York vitest run` and install `cross-env`.

- [ ] **Step 3: Write the failing test**

Create `frontend/src/shared/lib/clinicTime.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  addClinicDays,
  addClinicMonths,
  addClinicWeeks,
  clinicDateOf,
  clinicDayRange,
  clinicMonthGridRange,
  clinicRecentDaysRange,
  clinicTimeOf,
  clinicWeekRange,
} from './clinicTime'

describe('clinicDayRange', () => {
  it('spans clinic midnight to clinic midnight in summer time', () => {
    expect(clinicDayRange('2026-09-17')).toEqual({
      from: '2026-09-16T22:00:00.000Z',
      to: '2026-09-17T22:00:00.000Z',
    })
  })

  it('spans clinic midnight to clinic midnight in winter time', () => {
    expect(clinicDayRange('2026-01-15')).toEqual({
      from: '2026-01-14T23:00:00.000Z',
      to: '2026-01-15T23:00:00.000Z',
    })
  })

  it('covers 23 hours on the spring-forward day', () => {
    const { from, to } = clinicDayRange('2026-03-29')
    const hours = (Date.parse(to) - Date.parse(from)) / 3_600_000

    expect(hours).toBe(23)
  })

  it('covers 25 hours on the autumn day', () => {
    const { from, to } = clinicDayRange('2026-10-25')
    const hours = (Date.parse(to) - Date.parse(from)) / 3_600_000

    expect(hours).toBe(25)
  })
})

describe('clinicWeekRange', () => {
  it('starts on Monday and spans seven days', () => {
    const { from, to } = clinicWeekRange('2026-09-17')

    expect(from).toBe(clinicDayRange('2026-09-14').from)
    expect(to).toBe(clinicDayRange('2026-09-20').to)
  })
})

describe('clinicMonthGridRange', () => {
  it('covers the 42-day grid starting on a Monday', () => {
    const { from, to } = clinicMonthGridRange('2026-09-17')
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000

    expect(from).toBe(clinicDayRange('2026-08-31').from)
    expect(days).toBe(42)
  })
})

describe('clinicRecentDaysRange', () => {
  it('covers whole days ending with the given date', () => {
    const { from, to } = clinicRecentDaysRange(28, '2026-09-17')

    expect(from).toBe(clinicDayRange('2026-08-21').from)
    expect(to).toBe(clinicDayRange('2026-09-17').to)
  })
})

describe('clinicDateOf and clinicTimeOf', () => {
  it('resolves an instant to the clinic calendar day', () => {
    expect(clinicDateOf('2026-09-16T23:30:00Z')).toBe('2026-09-17')
    expect(clinicTimeOf('2026-09-16T23:30:00Z')).toBe('01:30')
  })

  it('formats a working hour in the clinic zone', () => {
    expect(clinicDateOf('2026-09-17T07:00:00Z')).toBe('2026-09-17')
    expect(clinicTimeOf('2026-09-17T07:00:00Z')).toBe('09:00')
  })
})

describe('clinic date arithmetic', () => {
  it('moves by days, weeks and months', () => {
    expect(addClinicDays('2026-09-17', 1)).toBe('2026-09-18')
    expect(addClinicDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addClinicWeeks('2026-09-17', -1)).toBe('2026-09-10')
    expect(addClinicMonths('2026-01-31', 1)).toBe('2026-02-28')
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/shared/lib/clinicTime.test.ts`
Expected: FAIL — `Failed to resolve import "./clinicTime"`.

- [ ] **Step 5: Implement the module**

Create `frontend/src/shared/lib/clinicTime.ts`:

```ts
import { TZDate } from '@date-fns/tz'
import { addDays, addMonths, format, startOfMonth, startOfWeek } from 'date-fns'

export const CLINIC_TIME_ZONE = 'Europe/Belgrade'

export interface DateRange {
  from: string
  to: string
}

function clinicMidnight(dateIso: string): TZDate {
  const [year, month, day] = dateIso.split('-').map(Number)
  return new TZDate(year, month - 1, day, 0, 0, 0, 0, CLINIC_TIME_ZONE)
}

function zoned(utcIso: string): TZDate {
  return new TZDate(new Date(utcIso), CLINIC_TIME_ZONE)
}

function dateIsoOf(value: TZDate): string {
  return format(value, 'yyyy-MM-dd')
}

function rangeOfDays(startDateIso: string, days: number): DateRange {
  const start = clinicMidnight(startDateIso)
  return { from: start.toISOString(), to: addDays(start, days).toISOString() }
}

export function clinicToday(): string {
  return dateIsoOf(new TZDate(new Date(), CLINIC_TIME_ZONE))
}

export function clinicDateOf(utcIso: string): string {
  return dateIsoOf(zoned(utcIso))
}

export function clinicTimeOf(utcIso: string): string {
  return format(zoned(utcIso), 'HH:mm')
}

export function clinicDayRange(dateIso: string): DateRange {
  return rangeOfDays(dateIso, 1)
}

export function clinicWeekRange(dateIso: string): DateRange {
  const monday = startOfWeek(clinicMidnight(dateIso), { weekStartsOn: 1 })
  return rangeOfDays(dateIsoOf(monday), 7)
}

export function clinicMonthGridRange(dateIso: string): DateRange {
  const gridStart = startOfWeek(startOfMonth(clinicMidnight(dateIso)), { weekStartsOn: 1 })
  return rangeOfDays(dateIsoOf(gridStart), 42)
}

export function clinicRecentDaysRange(days: number, endDateIso: string): DateRange {
  return rangeOfDays(addClinicDays(endDateIso, -(days - 1)), days)
}

export function addClinicDays(dateIso: string, amount: number): string {
  return dateIsoOf(addDays(clinicMidnight(dateIso), amount))
}

export function addClinicWeeks(dateIso: string, amount: number): string {
  return addClinicDays(dateIso, amount * 7)
}

export function addClinicMonths(dateIso: string, amount: number): string {
  return dateIsoOf(addMonths(clinicMidnight(dateIso), amount))
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/shared/lib/clinicTime.test.ts`
Expected: PASS (12 assertions across 9 tests).

If `startOfWeek`/`addDays` return a plain `Date` instead of a `TZDate`, wrap the result: `new TZDate(result, CLINIC_TIME_ZONE)` before formatting. The DST tests are the signal that the arithmetic is timezone-aware.

- [ ] **Step 7: Verify the whole suite still passes**

Run: `npx vitest run` then `npx tsc -b` then `npm run lint`
Expected: all green; the pinned `TZ` must not break existing tests.

---

### Task 2: Appointments data layer, and prune the mock UI

This task swaps the feature's model in one move, because the old components and the dashboard hooks all reference the mock shapes. It ends with a page shell; the calendar comes back in Tasks 3–6.

**Files:**
- Create: `frontend/src/features/appointments/lib/appointmentMapping.ts`
- Create: `frontend/src/features/appointments/lib/appointmentVisibility.ts`
- Create: `frontend/src/features/appointments/hooks/useAvailabilityQuery.ts`
- Modify: `frontend/src/features/appointments/types.ts` (rewrite)
- Modify: `frontend/src/features/appointments/api/appointmentsApi.ts` (rewrite)
- Modify: `frontend/src/features/appointments/api/appointmentKeys.ts` (rewrite)
- Modify: `frontend/src/features/appointments/hooks/useAppointmentsQuery.ts` (rewrite)
- Modify: `frontend/src/features/appointments/lib/dateHelpers.ts` (keep `WEEKDAYS` only)
- Modify: `frontend/src/features/appointments/index.ts`
- Modify: `frontend/src/pages/AppointmentsPage.tsx` (reduce to a shell)
- Modify: `frontend/src/widgets/dashboard/lib/appointmentStats.ts`
- Modify: `frontend/src/widgets/dashboard/hooks/usePeakHourToday.ts`, `useTodayAppointmentCount.ts`, `usePeakHoursBreakdown.ts`
- Modify: `frontend/src/widgets/dashboard/components/ScheduledTodayTile.tsx`
- Delete: `frontend/src/features/appointments/api/mockData.ts`, `api/mockPatients.ts`, `components/AppointmentFormPanel.tsx` (+ its CSS module), `components/AppointmentDetailPanel.tsx` (+ CSS), `components/AppointmentChip.tsx` (+ CSS), `components/DayView.tsx`, `components/WeekView.tsx`, `components/MonthView.tsx` (+ CSS modules), `frontend/src/shared/lib/simulateLatency.ts`
- Test: `frontend/src/features/appointments/lib/appointmentMapping.test.ts`, `lib/appointmentVisibility.test.ts`, `api/appointmentsApi.test.ts`, `hooks/useAppointmentsQuery.test.ts` (rewrite), `frontend/src/widgets/dashboard/lib/appointmentStats.test.ts` (rewrite), `frontend/src/widgets/dashboard/components/DashboardTiles.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `clinicDateOf`, `clinicTimeOf`, `clinicDayRange`, `clinicRecentDaysRange`, `clinicToday`, `DateRange` from Task 1.
- Produces:
  - Types `Appointment`, `AvailabilitySlot`, `AppointmentType`, `AppointmentStatus`, `CalendarView` as in the spec.
  - `getAppointments(range: DateRange): Promise<Appointment[]>`, `getAvailability(range: DateRange): Promise<AvailabilitySlot[]>`.
  - `appointmentKeys.all`, `appointmentKeys.list(range: DateRange)`, `appointmentKeys.availability(range: DateRange)`.
  - `useAppointmentsQuery(range: DateRange, enabled?: boolean)`, `useAvailabilityQuery(range: DateRange, enabled?: boolean)`.
  - `toAppointment(dto: AppointmentDto): Appointment`, `countsTowardLoad(appointment: Appointment): boolean`, `isVisible(appointment: Appointment, showCancelled: boolean): boolean`.

- [ ] **Step 1: Write the failing tests for mapping and visibility**

Create `frontend/src/features/appointments/lib/appointmentMapping.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toAppointment } from './appointmentMapping'
import type { AppointmentDto } from '../types'

const dto: AppointmentDto = {
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

describe('toAppointment', () => {
  it('maps nulls to undefined', () => {
    const appointment = toAppointment(dto)

    expect(appointment.ownerId).toBeUndefined()
    expect(appointment.patientName).toBeUndefined()
    expect(appointment.reason).toBeUndefined()
  })

  it('maps every type', () => {
    expect(toAppointment({ ...dto, type: 0 }).type).toBe('first_visit')
    expect(toAppointment({ ...dto, type: 1 }).type).toBe('checkup')
    expect(toAppointment({ ...dto, type: 2 }).type).toBe('blood_draw')
    expect(toAppointment({ ...dto, type: 3 }).type).toBe('surgery')
  })

  it('maps every status', () => {
    expect(toAppointment({ ...dto, status: 0 }).status).toBe('scheduled')
    expect(toAppointment({ ...dto, status: 1 }).status).toBe('checked_in')
    expect(toAppointment({ ...dto, status: 2 }).status).toBe('completed')
    expect(toAppointment({ ...dto, status: 3 }).status).toBe('no_show')
    expect(toAppointment({ ...dto, status: 4 }).status).toBe('cancelled')
  })

  it('throws on an unknown enum value', () => {
    expect(() => toAppointment({ ...dto, status: 9 })).toThrow(/status/i)
    expect(() => toAppointment({ ...dto, type: 9 })).toThrow(/type/i)
  })
})
```

Create `frontend/src/features/appointments/lib/appointmentVisibility.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { countsTowardLoad, isVisible } from './appointmentVisibility'
import type { Appointment, AppointmentStatus } from '../types'

function appointmentWith(status: AppointmentStatus): Appointment {
  return {
    id: 'a1',
    createdByUserId: 'u1',
    startsAt: '2026-09-17T07:00:00Z',
    endsAt: '2026-09-17T07:30:00Z',
    durationMinutes: 30,
    type: 'checkup',
    status,
    createdAt: '2026-09-10T10:00:00Z',
  }
}

describe('countsTowardLoad', () => {
  it('excludes cancelled and no-show', () => {
    expect(countsTowardLoad(appointmentWith('cancelled'))).toBe(false)
    expect(countsTowardLoad(appointmentWith('no_show'))).toBe(false)
    expect(countsTowardLoad(appointmentWith('scheduled'))).toBe(true)
    expect(countsTowardLoad(appointmentWith('checked_in'))).toBe(true)
    expect(countsTowardLoad(appointmentWith('completed'))).toBe(true)
  })
})

describe('isVisible', () => {
  it('hides cancelled and no-show unless asked for', () => {
    expect(isVisible(appointmentWith('cancelled'), false)).toBe(false)
    expect(isVisible(appointmentWith('cancelled'), true)).toBe(true)
    expect(isVisible(appointmentWith('completed'), false)).toBe(true)
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/features/appointments/lib`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the new types**

Replace `frontend/src/features/appointments/types.ts` with:

```ts
export type AppointmentType = 'first_visit' | 'checkup' | 'blood_draw' | 'surgery'
export type AppointmentStatus = 'scheduled' | 'checked_in' | 'completed' | 'no_show' | 'cancelled'
export type CalendarView = 'day' | 'week' | 'month'

export interface AppointmentDto {
  id: string
  createdByUserId: string
  ownerId: string | null
  patientId: string | null
  startsAt: string
  endsAt: string
  durationMinutes: number
  type: number
  status: number
  reason: string | null
  ownerName: string | null
  patientName: string | null
  createdAt: string
}

export interface Appointment {
  id: string
  createdByUserId: string
  ownerId?: string
  patientId?: string
  startsAt: string
  endsAt: string
  durationMinutes: number
  type: AppointmentType
  status: AppointmentStatus
  reason?: string
  ownerName?: string
  patientName?: string
  createdAt: string
}

export interface AvailabilitySlot {
  startsAt: string
  endsAt: string
  isAvailable: boolean
  isMine: boolean
}
```

- [ ] **Step 4: Implement mapping and visibility**

Create `frontend/src/features/appointments/lib/appointmentMapping.ts`:

```ts
import type { Appointment, AppointmentDto, AppointmentStatus, AppointmentType } from '../types'

const TYPES: Record<number, AppointmentType> = {
  0: 'first_visit',
  1: 'checkup',
  2: 'blood_draw',
  3: 'surgery',
}

const STATUSES: Record<number, AppointmentStatus> = {
  0: 'scheduled',
  1: 'checked_in',
  2: 'completed',
  3: 'no_show',
  4: 'cancelled',
}

function optional<T>(value: T | null): T | undefined {
  return value ?? undefined
}

export function typeFromApi(value: number): AppointmentType {
  const type = TYPES[value]
  if (!type) throw new Error(`Unknown appointment type: ${value}`)
  return type
}

export function statusFromApi(value: number): AppointmentStatus {
  const status = STATUSES[value]
  if (!status) throw new Error(`Unknown appointment status: ${value}`)
  return status
}

export function toAppointment(dto: AppointmentDto): Appointment {
  return {
    id: dto.id,
    createdByUserId: dto.createdByUserId,
    ownerId: optional(dto.ownerId),
    patientId: optional(dto.patientId),
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    durationMinutes: dto.durationMinutes,
    type: typeFromApi(dto.type),
    status: statusFromApi(dto.status),
    reason: optional(dto.reason),
    ownerName: optional(dto.ownerName),
    patientName: optional(dto.patientName),
    createdAt: dto.createdAt,
  }
}
```

Create `frontend/src/features/appointments/lib/appointmentVisibility.ts`:

```ts
import type { Appointment } from '../types'

export function countsTowardLoad(appointment: Appointment): boolean {
  return appointment.status !== 'cancelled' && appointment.status !== 'no_show'
}

export function isVisible(appointment: Appointment, showCancelled: boolean): boolean {
  return showCancelled || countsTowardLoad(appointment)
}
```

- [ ] **Step 5: Run the lib tests**

Run: `npx vitest run src/features/appointments/lib`
Expected: PASS.

- [ ] **Step 6: Write the failing API test**

Replace `frontend/src/features/appointments/api/appointmentsApi.test.ts` (create it) with:

```ts
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
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx vitest run src/features/appointments/api/appointmentsApi.test.ts`
Expected: FAIL — `getAvailability` is not exported.

- [ ] **Step 8: Rewrite the API, keys and hooks**

Replace `frontend/src/features/appointments/api/appointmentsApi.ts`:

```ts
import { apiFetch } from '@/shared/lib/apiClient'
import type { DateRange } from '@/shared/lib/clinicTime'
import { toAppointment } from '../lib/appointmentMapping'
import type { Appointment, AppointmentDto, AvailabilitySlot } from '../types'

function rangeQuery(range: DateRange): string {
  const params = new URLSearchParams()
  params.set('from', range.from)
  params.set('to', range.to)
  return params.toString()
}

export async function getAppointments(range: DateRange): Promise<Appointment[]> {
  const response = await apiFetch<AppointmentDto[]>(`/appointments?${rangeQuery(range)}`)
  return response.map(toAppointment)
}

export function getAvailability(range: DateRange): Promise<AvailabilitySlot[]> {
  return apiFetch<AvailabilitySlot[]>(`/appointments/availability?${rangeQuery(range)}`)
}
```

Replace `frontend/src/features/appointments/api/appointmentKeys.ts`:

```ts
import type { DateRange } from '@/shared/lib/clinicTime'

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (range: DateRange) => [...appointmentKeys.all, 'list', range.from, range.to] as const,
  availability: (range: DateRange) =>
    [...appointmentKeys.all, 'availability', range.from, range.to] as const,
}
```

Replace `frontend/src/features/appointments/hooks/useAppointmentsQuery.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/shared/lib/clinicTime'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAppointments } from '../api/appointmentsApi'

export function useAppointmentsQuery(range: DateRange, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.list(range),
    queryFn: () => getAppointments(range),
    enabled,
  })
}
```

Create `frontend/src/features/appointments/hooks/useAvailabilityQuery.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/shared/lib/clinicTime'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAvailability } from '../api/appointmentsApi'

export function useAvailabilityQuery(range: DateRange, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.availability(range),
    queryFn: () => getAvailability(range),
    enabled,
  })
}
```

- [ ] **Step 9: Rewrite the hook test**

Replace `frontend/src/features/appointments/hooks/useAppointmentsQuery.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as appointmentsApi from '../api/appointmentsApi'
import { appointmentKeys } from '../api/appointmentKeys'
import { useAppointmentsQuery } from './useAppointmentsQuery'
import type { Appointment } from '../types'

const range = { from: '2026-09-16T22:00:00.000Z', to: '2026-09-17T22:00:00.000Z' }
const otherRange = { from: '2026-09-17T22:00:00.000Z', to: '2026-09-18T22:00:00.000Z' }

const appointment: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  startsAt: '2026-09-17T07:00:00Z',
  endsAt: '2026-09-17T07:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  createdAt: '2026-09-10T10:00:00Z',
}

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  getAppointmentsSpy = vi.spyOn(appointmentsApi, 'getAppointments').mockResolvedValue([appointment])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('appointmentKeys', () => {
  it('prefixes the list so one invalidation clears it', () => {
    expect(appointmentKeys.list(range).slice(0, 1)).toEqual([...appointmentKeys.all])
  })

  it('keys each range separately', () => {
    expect(appointmentKeys.list(range)).not.toEqual(appointmentKeys.list(otherRange))
  })
})

describe('useAppointmentsQuery', () => {
  it('returns the appointments for the range', async () => {
    const { result } = renderHook(() => useAppointmentsQuery(range), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.data).toEqual([appointment]))
    expect(getAppointmentsSpy).toHaveBeenCalledWith(range)
  })

  it('shares one request between callers of the same range', async () => {
    renderHook(
      () => {
        useAppointmentsQuery(range)
        useAppointmentsQuery(range)
      },
      { wrapper: QueryWrapper },
    )

    await waitFor(() => expect(getAppointmentsSpy).toHaveBeenCalledTimes(1))
  })

  it('does not fetch while disabled', async () => {
    renderHook(() => useAppointmentsQuery(range, false), { wrapper: QueryWrapper })

    await waitFor(() => expect(getAppointmentsSpy).not.toHaveBeenCalled())
  })
})
```

- [ ] **Step 10: Delete the mock layer and old components**

```bash
cd frontend
rm src/features/appointments/api/mockData.ts src/features/appointments/api/mockPatients.ts
rm src/features/appointments/components/AppointmentFormPanel.tsx src/features/appointments/components/AppointmentFormPanel.module.css
rm src/features/appointments/components/AppointmentDetailPanel.tsx src/features/appointments/components/AppointmentDetailPanel.module.css
rm src/features/appointments/components/AppointmentChip.tsx src/features/appointments/components/AppointmentChip.module.css
rm src/features/appointments/components/DayView.tsx src/features/appointments/components/DayView.module.css
rm src/features/appointments/components/WeekView.tsx src/features/appointments/components/WeekView.module.css
rm src/features/appointments/components/MonthView.tsx src/features/appointments/components/MonthView.module.css
rm src/shared/lib/simulateLatency.ts
```

In `frontend/src/features/appointments/lib/dateHelpers.ts`, keep only:

```ts
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
```

Replace `frontend/src/features/appointments/index.ts`:

```ts
export { CalendarToolbar } from './components/CalendarToolbar'
export { getAppointments, getAvailability } from './api/appointmentsApi'
export { appointmentKeys } from './api/appointmentKeys'
export { useAppointmentsQuery } from './hooks/useAppointmentsQuery'
export { useAvailabilityQuery } from './hooks/useAvailabilityQuery'
export { countsTowardLoad, isVisible } from './lib/appointmentVisibility'
export { WEEKDAYS } from './lib/dateHelpers'
export type { Appointment, AppointmentStatus, AppointmentType, AvailabilitySlot, CalendarView } from './types'
```

- [ ] **Step 11: Reduce the page to a shell**

Replace `frontend/src/pages/AppointmentsPage.tsx` with a placeholder that keeps the route alive (the calendar returns in Task 6):

```tsx
import styles from './AppointmentsPage.module.css'

export function AppointmentsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Appointment calendar — day, week, and month view.</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12: Write the failing dashboard tests**

Replace `frontend/src/widgets/dashboard/lib/appointmentStats.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { appointmentsOn, countByHour, dayBreakdown, hourHistogram, peakOf } from './appointmentStats'
import type { Appointment } from '@/features/appointments'

function appointmentAt(startsAt: string, status: Appointment['status'] = 'scheduled'): Appointment {
  return {
    id: startsAt,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status,
    createdAt: '2026-09-01T00:00:00Z',
  }
}

const appointments = [
  appointmentAt('2026-09-17T07:00:00Z'),
  appointmentAt('2026-09-17T07:30:00Z'),
  appointmentAt('2026-09-17T12:00:00Z'),
  appointmentAt('2026-09-16T23:30:00Z'),
]

describe('appointmentsOn', () => {
  it('groups by the clinic day, not the UTC day', () => {
    expect(appointmentsOn(appointments, '2026-09-17')).toHaveLength(4)
  })
})

describe('countByHour and peakOf', () => {
  it('buckets by the clinic hour of the start time', () => {
    const counts = countByHour(appointments)

    expect(counts.get('09:00')).toBe(2)
    expect(counts.get('14:00')).toBe(1)
    expect(counts.get('01:00')).toBe(1)
    expect(peakOf(counts)).toEqual({ hour: '09:00', count: 2 })
  })
})

describe('hourHistogram', () => {
  it('covers opening hours plus any hour that has appointments', () => {
    const histogram = hourHistogram(appointments)

    expect(histogram.find((entry) => entry.hour === '07:00')?.count).toBe(0)
    expect(histogram.find((entry) => entry.hour === '09:00')?.count).toBe(2)
    expect(histogram.find((entry) => entry.hour === '01:00')?.count).toBe(1)
    expect(histogram.map((entry) => entry.hour)).toEqual([...histogram.map((entry) => entry.hour)].sort())
  })
})

describe('dayBreakdown', () => {
  it('counts by clinic weekday', () => {
    const thursday = dayBreakdown(appointments).find((entry) => entry.day === 'Thursday')

    expect(thursday?.total).toBe(4)
  })
})
```

Replace the appointment parts of `frontend/src/widgets/dashboard/components/DashboardTiles.test.tsx` so `getAppointments` is mocked with the new signature. The file's patient tile tests stay as they are; update the appointment mock to:

```ts
  vi.spyOn(appointmentsApi, 'getAppointments').mockResolvedValue([
    {
      id: 'a1',
      createdByUserId: 'u1',
      startsAt: '2026-09-17T07:00:00Z',
      endsAt: '2026-09-17T07:30:00Z',
      durationMinutes: 30,
      type: 'checkup',
      status: 'scheduled',
      createdAt: '2026-09-10T10:00:00Z',
    },
  ])
```

and add a test that cancelled appointments do not count:

```ts
  it('ignores cancelled appointments in the today count', async () => {
    vi.spyOn(appointmentsApi, 'getAppointments').mockResolvedValue([
      {
        id: 'a2',
        createdByUserId: 'u1',
        startsAt: '2026-09-17T07:00:00Z',
        endsAt: '2026-09-17T07:30:00Z',
        durationMinutes: 30,
        type: 'checkup',
        status: 'cancelled',
        createdAt: '2026-09-10T10:00:00Z',
      },
    ])

    render(<ScheduledTodayTile />, { wrapper: QueryWrapper })

    expect(await screen.findByText('0')).toBeInTheDocument()
  })
```

Adjust the imports and render helper to match the file's existing style; if the tile renders inside a router, keep that wrapper.

- [ ] **Step 13: Run them to verify they fail**

Run: `npx vitest run src/widgets/dashboard`
Expected: FAIL — `appointmentsOn` still expects `date`/`time`.

- [ ] **Step 14: Rewrite the dashboard stats and hooks**

Replace `frontend/src/widgets/dashboard/lib/appointmentStats.ts`:

```ts
import { WEEKDAYS, countsTowardLoad } from '@/features/appointments'
import type { Appointment } from '@/features/appointments'
import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'

export interface HourCount {
  hour: string
  count: number
}

export interface DayBreakdown {
  day: string
  total: number
  peakHour: HourCount | null
}

export const PEAK_HOURS_RANGE = Array.from(
  { length: 13 },
  (_, index) => `${String(index + 7).padStart(2, '0')}:00`,
)

const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function hourBucket(startsAt: string): string {
  return `${clinicTimeOf(startsAt).slice(0, 2)}:00`
}

export function countByHour(appointments: Appointment[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const appointment of appointments) {
    const hour = hourBucket(appointment.startsAt)
    counts.set(hour, (counts.get(hour) ?? 0) + 1)
  }
  return counts
}

export function peakOf(counts: Map<string, number>): HourCount | null {
  let peak: HourCount | null = null
  for (const [hour, count] of counts) {
    if (!peak || count > peak.count) {
      peak = { hour, count }
    }
  }
  return peak
}

export function appointmentsOn(appointments: Appointment[], dateIso: string): Appointment[] {
  return appointments.filter((appointment) => clinicDateOf(appointment.startsAt) === dateIso)
}

export function countedAppointments(appointments: Appointment[]): Appointment[] {
  return appointments.filter(countsTowardLoad)
}

export function hourHistogram(appointments: Appointment[]): HourCount[] {
  const counts = countByHour(appointments)
  const hours = new Set([...PEAK_HOURS_RANGE, ...counts.keys()])

  return [...hours].sort().map((hour) => ({ hour, count: counts.get(hour) ?? 0 }))
}

export function dayBreakdown(appointments: Appointment[]): DayBreakdown[] {
  return MONDAY_FIRST_ORDER.map((weekdayIndex) => {
    const forDay = appointments.filter((appointment) => {
      const [year, month, day] = clinicDateOf(appointment.startsAt).split('-').map(Number)
      return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === weekdayIndex
    })

    return {
      day: WEEKDAYS[weekdayIndex],
      total: forDay.length,
      peakHour: peakOf(countByHour(forDay)),
    }
  })
}
```

Replace `frontend/src/widgets/dashboard/hooks/useTodayAppointmentCount.ts`:

```ts
import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { clinicDayRange, clinicToday } from '@/shared/lib/clinicTime'
import { countedAppointments } from '../lib/appointmentStats'

export function useTodayAppointmentCount(): { count: number; isPending: boolean } {
  const today = clinicToday()
  const { data, isPending } = useAppointmentsQuery(clinicDayRange(today))

  const count = useMemo(() => (data ? countedAppointments(data).length : 0), [data])

  return { count, isPending }
}
```

Replace `frontend/src/widgets/dashboard/hooks/usePeakHourToday.ts`:

```ts
import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { clinicDayRange, clinicToday } from '@/shared/lib/clinicTime'
import { countByHour, countedAppointments, peakOf, type HourCount } from '../lib/appointmentStats'

export function usePeakHourToday(): { peakHour: HourCount | null; isPending: boolean } {
  const today = clinicToday()
  const { data, isPending } = useAppointmentsQuery(clinicDayRange(today))

  const peakHour = useMemo(
    () => (data ? peakOf(countByHour(countedAppointments(data))) : null),
    [data],
  )

  return { peakHour, isPending }
}
```

In `frontend/src/widgets/dashboard/hooks/usePeakHoursBreakdown.ts`, change the query and the average:

```ts
import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { clinicRecentDaysRange, clinicToday } from '@/shared/lib/clinicTime'
import {
  countByHour,
  countedAppointments,
  dayBreakdown,
  hourHistogram,
  peakOf,
  type DayBreakdown,
  type HourCount,
} from '../lib/appointmentStats'

const BREAKDOWN_DAYS = 28

export interface PeakHoursBreakdown {
  peakHour: HourCount | null
  busiestDay: DayBreakdown | null
  averagePerDay: number
  totalAppointments: number
  byHour: HourCount[]
  byDay: DayBreakdown[]
}

export function usePeakHoursBreakdown(enabled: boolean): PeakHoursBreakdown | null {
  const range = clinicRecentDaysRange(BREAKDOWN_DAYS, clinicToday())
  const { data } = useAppointmentsQuery(range, enabled)

  return useMemo(() => {
    if (!data) return null

    const counted = countedAppointments(data)
    const byDay = dayBreakdown(counted)
    const busiestDay = byDay.reduce<DayBreakdown | null>(
      (best, day) => (day.total > 0 && (!best || day.total > best.total) ? day : best),
      null,
    )

    return {
      peakHour: peakOf(countByHour(counted)),
      busiestDay,
      averagePerDay: Math.round((counted.length / BREAKDOWN_DAYS) * 10) / 10,
      totalAppointments: counted.length,
      byHour: hourHistogram(counted),
      byDay,
    }
  }, [data])
}
```

In `frontend/src/widgets/dashboard/components/ScheduledTodayTile.tsx`, replace `todayIso()` from `@/shared/lib/dateOnly` with `clinicToday()` from `@/shared/lib/clinicTime` in the link target.

- [ ] **Step 15: Run the full suite and fix fallout**

Run: `npx vitest run` then `npx tsc -b` then `npm run lint`
Expected: all green. Any remaining reference to `mockPatients`, `simulateLatency`, `AppointmentInput` or the old `Appointment` shape is a compile error to remove.

---

### Task 3: Appointment chip and labels

**Files:**
- Create: `frontend/src/features/appointments/lib/appointmentLabels.ts`
- Create: `frontend/src/features/appointments/components/AppointmentChip.tsx`
- Create: `frontend/src/features/appointments/components/AppointmentChip.module.css`
- Test: `frontend/src/features/appointments/components/AppointmentChip.test.tsx`

**Interfaces:**
- Consumes: `Appointment` (Task 2), `clinicTimeOf` (Task 1).
- Produces: `typeLabel(type: AppointmentType): string`, `statusLabel(status: AppointmentStatus): string`, `statusTone(status: AppointmentStatus): BadgeTone`, `appointmentTimeLabel(appointment: Appointment): string`, `partyLabel(appointment: Appointment): string`, and `<AppointmentChip appointment onClick />`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/appointments/components/AppointmentChip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentChip } from './AppointmentChip'
import type { Appointment } from '../types'

const base: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: 'o1',
  patientId: 'p1',
  startsAt: '2026-09-17T07:00:00Z',
  endsAt: '2026-09-17T07:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  reason: 'limping',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

describe('AppointmentChip', () => {
  it('shows the clinic start time, patient and owner', () => {
    render(<AppointmentChip appointment={base} onClick={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('09:00')
    expect(screen.getByRole('button')).toHaveTextContent('Luna · Ana Petrović')
  })

  it('shows a time range for a longer appointment', () => {
    const surgery: Appointment = {
      ...base,
      type: 'surgery',
      durationMinutes: 90,
      endsAt: '2026-09-17T08:30:00Z',
    }

    render(<AppointmentChip appointment={surgery} onClick={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('09:00–10:30')
  })

  it('explains a booking with no patient', () => {
    render(
      <AppointmentChip
        appointment={{ ...base, patientId: undefined, patientName: undefined }}
        onClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toHaveTextContent('No patient yet · Ana Petrović')
  })

  it('falls back to a client booking label with no owner either', () => {
    render(
      <AppointmentChip
        appointment={{
          ...base,
          patientId: undefined,
          patientName: undefined,
          ownerId: undefined,
          ownerName: undefined,
        }}
        onClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toHaveTextContent('Client booking')
  })

  it('describes type, status and reason in the tooltip', () => {
    render(<AppointmentChip appointment={{ ...base, status: 'checked_in' }} onClick={vi.fn()} />)

    expect(screen.getByRole('button').title).toBe('Checkup · Checked in · limping')
  })

  it('calls onClick', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<AppointmentChip appointment={base} onClick={onClick} />)
    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/appointments/components/AppointmentChip.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the labels**

Create `frontend/src/features/appointments/lib/appointmentLabels.ts`:

```ts
import type { BadgeTone } from '@/shared/ui'
import { clinicTimeOf } from '@/shared/lib/clinicTime'
import type { Appointment, AppointmentStatus, AppointmentType } from '../types'

const TYPE_LABELS: Record<AppointmentType, string> = {
  first_visit: 'First visit',
  checkup: 'Checkup',
  blood_draw: 'Blood draw',
  surgery: 'Surgery',
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked in',
  completed: 'Completed',
  no_show: 'No show',
  cancelled: 'Cancelled',
}

const STATUS_TONES: Record<AppointmentStatus, BadgeTone> = {
  scheduled: 'neutral',
  checked_in: 'ok',
  completed: 'neutral',
  no_show: 'danger',
  cancelled: 'danger',
}

export function typeLabel(type: AppointmentType): string {
  return TYPE_LABELS[type]
}

export function statusLabel(status: AppointmentStatus): string {
  return STATUS_LABELS[status]
}

export function statusTone(status: AppointmentStatus): BadgeTone {
  return STATUS_TONES[status]
}

export function appointmentTimeLabel(appointment: Appointment): string {
  const start = clinicTimeOf(appointment.startsAt)
  if (appointment.durationMinutes <= 30) return start
  return `${start}–${clinicTimeOf(appointment.endsAt)}`
}

export function partyLabel(appointment: Appointment): string {
  const patient = appointment.patientName ?? 'No patient yet'
  if (appointment.ownerName) return `${patient} · ${appointment.ownerName}`
  return appointment.patientName ?? 'Client booking'
}
```

If `BadgeTone` is not exported from `@/shared/ui`, add `export type { BadgeTone } from './Badge/Badge'` to `frontend/src/shared/ui/index.ts`.

- [ ] **Step 4: Implement the chip**

Create `frontend/src/features/appointments/components/AppointmentChip.tsx`:

```tsx
import { appointmentTimeLabel, partyLabel, statusLabel, typeLabel } from '../lib/appointmentLabels'
import type { Appointment } from '../types'
import styles from './AppointmentChip.module.css'

export interface AppointmentChipProps {
  appointment: Appointment
  onClick: () => void
}

export function AppointmentChip({ appointment, onClick }: AppointmentChipProps) {
  const title = [typeLabel(appointment.type), statusLabel(appointment.status), appointment.reason]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${styles.chip} ${styles[appointment.status]}`}
    >
      {appointmentTimeLabel(appointment)} {partyLabel(appointment)}
    </button>
  )
}
```

Create `frontend/src/features/appointments/components/AppointmentChip.module.css`, reusing the deleted chip's styling as a base (recover it with `git show HEAD:frontend/src/features/appointments/components/AppointmentChip.module.css`) and adding one class per status:

```css
.chip { /* keep the previous .chip rules */ }
.scheduled { }
.checked_in { font-weight: 600; }
.completed { opacity: 0.65; }
.no_show,
.cancelled { opacity: 0.6; text-decoration: line-through; }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/features/appointments/components/AppointmentChip.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Export the chip**

Add to `frontend/src/features/appointments/index.ts`:

```ts
export { AppointmentChip } from './components/AppointmentChip'
export { statusLabel, statusTone, typeLabel, appointmentTimeLabel, partyLabel } from './lib/appointmentLabels'
```

Run: `npx vitest run` and `npx tsc -b`
Expected: green.

---

### Task 4: Day view on availability slots

**Files:**
- Create: `frontend/src/features/appointments/lib/daySlots.ts`
- Create: `frontend/src/features/appointments/components/DayView.tsx`
- Create: `frontend/src/features/appointments/components/DayView.module.css`
- Test: `frontend/src/features/appointments/lib/daySlots.test.ts`, `frontend/src/features/appointments/components/DayView.test.tsx`

**Interfaces:**
- Consumes: `Appointment`, `AvailabilitySlot` (Task 2), `AppointmentChip` (Task 3), `clinicTimeOf`, `clinicDateOf` (Task 1).
- Produces: `buildDayRows(appointments, slots): DayRow[]` where `DayRow = { startsAt: string; endsAt: string; label: string; starting: Appointment[]; continuing: Appointment[]; isFree: boolean }`; `appointmentsOutsideSlots(appointments, slots): Appointment[]`; `<DayView date slots appointments onAppointmentClick isLoading hasSlotData />`.

- [ ] **Step 1: Write the failing test for the row builder**

Create `frontend/src/features/appointments/lib/daySlots.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { appointmentsOutsideSlots, buildDayRows } from './daySlots'
import type { Appointment, AvailabilitySlot } from '../types'

function slot(startsAt: string, endsAt: string, isAvailable = true): AvailabilitySlot {
  return { startsAt, endsAt, isAvailable, isMine: false }
}

function appointment(id: string, startsAt: string, endsAt: string, durationMinutes = 30): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt,
    durationMinutes,
    type: durationMinutes > 30 ? 'surgery' : 'checkup',
    status: 'scheduled',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

const slots = [
  slot('2026-09-17T05:00:00Z', '2026-09-17T05:30:00Z', false),
  slot('2026-09-17T05:30:00Z', '2026-09-17T06:00:00Z', false),
  slot('2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z'),
]

describe('buildDayRows', () => {
  it('labels rows with the clinic time', () => {
    const rows = buildDayRows([], slots)

    expect(rows.map((row) => row.label)).toEqual(['07:00', '07:30', '08:00'])
  })

  it('places an appointment in the slot it starts in', () => {
    const rows = buildDayRows([appointment('a1', '2026-09-17T05:00:00Z', '2026-09-17T05:30:00Z')], slots)

    expect(rows[0].starting.map((item) => item.id)).toEqual(['a1'])
    expect(rows[1].starting).toHaveLength(0)
  })

  it('marks later slots of a long appointment as continuing', () => {
    const surgery = appointment('s1', '2026-09-17T05:00:00Z', '2026-09-17T06:00:00Z', 60)
    const rows = buildDayRows([surgery], slots)

    expect(rows[0].starting.map((item) => item.id)).toEqual(['s1'])
    expect(rows[1].continuing.map((item) => item.id)).toEqual(['s1'])
    expect(rows[2].continuing).toHaveLength(0)
  })

  it('marks a slot free only when it is available and nothing starts there', () => {
    const rows = buildDayRows([appointment('a1', '2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z')], slots)

    expect(rows[0].isFree).toBe(false)
    expect(rows[2].isFree).toBe(false)
    expect(buildDayRows([], slots)[2].isFree).toBe(true)
  })
})

describe('appointmentsOutsideSlots', () => {
  it('returns appointments that start in no slot', () => {
    const early = appointment('e1', '2026-09-17T03:00:00Z', '2026-09-17T03:30:00Z')
    const inside = appointment('i1', '2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z')

    expect(appointmentsOutsideSlots([early, inside], slots).map((item) => item.id)).toEqual(['e1'])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/appointments/lib/daySlots.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the row builder**

Create `frontend/src/features/appointments/lib/daySlots.ts`:

```ts
import { clinicTimeOf } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'

export interface DayRow {
  startsAt: string
  endsAt: string
  label: string
  starting: Appointment[]
  continuing: Appointment[]
  isFree: boolean
}

function startsInSlot(appointment: Appointment, slot: AvailabilitySlot): boolean {
  const start = Date.parse(appointment.startsAt)
  return start >= Date.parse(slot.startsAt) && start < Date.parse(slot.endsAt)
}

function overlapsSlot(appointment: Appointment, slot: AvailabilitySlot): boolean {
  return (
    Date.parse(appointment.startsAt) < Date.parse(slot.endsAt) &&
    Date.parse(appointment.endsAt) > Date.parse(slot.startsAt)
  )
}

export function buildDayRows(appointments: Appointment[], slots: AvailabilitySlot[]): DayRow[] {
  return slots.map((slot) => {
    const starting = appointments
      .filter((appointment) => startsInSlot(appointment, slot))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

    const continuing = appointments.filter(
      (appointment) => overlapsSlot(appointment, slot) && !startsInSlot(appointment, slot),
    )

    return {
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      label: clinicTimeOf(slot.startsAt),
      starting,
      continuing,
      isFree: slot.isAvailable && starting.length === 0,
    }
  })
}

export function appointmentsOutsideSlots(
  appointments: Appointment[],
  slots: AvailabilitySlot[],
): Appointment[] {
  return appointments.filter((appointment) => !slots.some((slot) => startsInSlot(appointment, slot)))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/appointments/lib/daySlots.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing DayView test**

Create `frontend/src/features/appointments/components/DayView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DayView } from './DayView'
import type { Appointment, AvailabilitySlot } from '../types'

const slots: AvailabilitySlot[] = [
  { startsAt: '2026-09-17T05:00:00Z', endsAt: '2026-09-17T05:30:00Z', isAvailable: false, isMine: false },
  { startsAt: '2026-09-17T05:30:00Z', endsAt: '2026-09-17T06:00:00Z', isAvailable: true, isMine: false },
]

const appointment: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  patientId: 'p1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

function renderDay(appointments: Appointment[], daySlots: AvailabilitySlot[], hasSlotData = true) {
  render(
    <DayView
      date="2026-09-17"
      slots={daySlots}
      appointments={appointments}
      onAppointmentClick={vi.fn()}
      isLoading={false}
      hasSlotData={hasSlotData}
    />,
  )
}

describe('DayView', () => {
  it('renders a row per slot with clinic times', () => {
    renderDay([], slots)

    expect(screen.getByText('07:00')).toBeInTheDocument()
    expect(screen.getByText('07:30')).toBeInTheDocument()
  })

  it('shows the appointment in its slot and marks free slots', () => {
    renderDay([appointment], slots)

    expect(screen.getByRole('button', { name: /Luna/ })).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('marks the slots a long appointment continues into', () => {
    renderDay(
      [{ ...appointment, durationMinutes: 60, endsAt: '2026-09-17T06:00:00Z' }],
      slots,
    )

    expect(screen.getByText('↳ continues')).toBeInTheDocument()
  })

  it('says the clinic is closed when there are no slots', () => {
    renderDay([], [])

    expect(screen.getByText('The clinic is closed on this day.')).toBeInTheDocument()
  })

  it('does not claim closed when slot data is missing', () => {
    renderDay([], [], false)

    expect(screen.queryByText('The clinic is closed on this day.')).not.toBeInTheDocument()
  })

  it('groups appointments outside opening hours', () => {
    renderDay([{ ...appointment, startsAt: '2026-09-17T03:00:00Z', endsAt: '2026-09-17T03:30:00Z' }], slots)

    expect(screen.getByText('Outside opening hours')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/features/appointments/components/DayView.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement DayView**

Create `frontend/src/features/appointments/components/DayView.tsx`:

```tsx
import { EmptyState, Skeleton } from '@/shared/ui'
import { AppointmentChip } from './AppointmentChip'
import { appointmentsOutsideSlots, buildDayRows } from '../lib/daySlots'
import type { Appointment, AvailabilitySlot } from '../types'
import styles from './DayView.module.css'

export interface DayViewProps {
  date: string
  slots: AvailabilitySlot[]
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  isLoading?: boolean
  hasSlotData: boolean
}

export function DayView({
  slots,
  appointments,
  onAppointmentClick,
  isLoading,
  hasSlotData,
}: DayViewProps) {
  if (isLoading) {
    return <Skeleton height="20rem" />
  }

  const rows = buildDayRows(appointments, slots)
  const outside = appointmentsOutsideSlots(appointments, slots)

  if (hasSlotData && slots.length === 0 && outside.length === 0) {
    return <EmptyState message="The clinic is closed on this day." />
  }

  return (
    <div className={styles.day}>
      {outside.length > 0 && (
        <div className={styles.outside}>
          <span className={styles.outsideLabel}>Outside opening hours</span>
          <div className={styles.slotChips}>
            {outside.map((appointment) => (
              <AppointmentChip
                key={appointment.id}
                appointment={appointment}
                onClick={() => onAppointmentClick(appointment)}
              />
            ))}
          </div>
        </div>
      )}

      {rows.map((row) => (
        <div key={row.startsAt} className={styles.slotRow}>
          <span className={styles.slotLabel}>{row.label}</span>
          <div className={styles.slotChips}>
            {row.starting.map((appointment) => (
              <AppointmentChip
                key={appointment.id}
                appointment={appointment}
                onClick={() => onAppointmentClick(appointment)}
              />
            ))}
            {row.continuing.length > 0 && <span className={styles.continues}>↳ continues</span>}
            {row.isFree && <span className={styles.free}>Free</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
```

Create `frontend/src/features/appointments/components/DayView.module.css` from the deleted file (`git show HEAD:frontend/src/features/appointments/components/DayView.module.css`), renaming `.hourRow` to `.slotRow`, `.hourLabel` to `.slotLabel`, `.hourSlots` to `.slotChips`, and adding muted `.free`, `.continues` and `.outside` / `.outsideLabel` rules.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/features/appointments`
Expected: PASS.

- [ ] **Step 9: Export DayView**

Add `export { DayView } from './components/DayView'` to `frontend/src/features/appointments/index.ts`.

Run: `npx vitest run` and `npx tsc -b` and `npm run lint`
Expected: green.

---

### Task 5: Week and month views

**Files:**
- Create: `frontend/src/features/appointments/lib/calendarDays.ts`
- Create: `frontend/src/features/appointments/components/WeekView.tsx` (+ `.module.css`)
- Create: `frontend/src/features/appointments/components/MonthView.tsx` (+ `.module.css`)
- Test: `frontend/src/features/appointments/lib/calendarDays.test.ts`, `components/WeekView.test.tsx`, `components/MonthView.test.tsx`

**Interfaces:**
- Consumes: `Appointment`, `AvailabilitySlot`, `AppointmentChip`, `clinicDateOf`, `clinicToday`, `addClinicDays`.
- Produces: `groupByClinicDate(appointments): Map<string, Appointment[]>`; `openDates(slots): Set<string>`; `<WeekView date appointments slots onAppointmentClick onDateSelect isLoading hasSlotData />` and `<MonthView …>` with the same props.

- [ ] **Step 1: Write the failing test for the grouping helpers**

Create `frontend/src/features/appointments/lib/calendarDays.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { groupByClinicDate, openDates } from './calendarDays'
import type { Appointment, AvailabilitySlot } from '../types'

function appointment(id: string, startsAt: string): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status: 'scheduled',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

describe('groupByClinicDate', () => {
  it('groups by clinic day and sorts by start time', () => {
    const grouped = groupByClinicDate([
      appointment('late', '2026-09-16T23:30:00Z'),
      appointment('early', '2026-09-17T05:00:00Z'),
    ])

    expect(grouped.get('2026-09-17')?.map((item) => item.id)).toEqual(['early', 'late'])
  })
})

describe('openDates', () => {
  it('collects the clinic dates that have slots', () => {
    const slots: AvailabilitySlot[] = [
      { startsAt: '2026-09-17T05:00:00Z', endsAt: '2026-09-17T05:30:00Z', isAvailable: true, isMine: false },
    ]

    expect(openDates(slots).has('2026-09-17')).toBe(true)
    expect(openDates(slots).has('2026-09-18')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/appointments/lib/calendarDays.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

Create `frontend/src/features/appointments/lib/calendarDays.ts`:

```ts
import { clinicDateOf } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'

export function groupByClinicDate(appointments: Appointment[]): Map<string, Appointment[]> {
  const grouped = new Map<string, Appointment[]>()

  for (const appointment of appointments) {
    const date = clinicDateOf(appointment.startsAt)
    grouped.set(date, [...(grouped.get(date) ?? []), appointment])
  }

  for (const [date, items] of grouped) {
    grouped.set(date, [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
  }

  return grouped
}

export function openDates(slots: AvailabilitySlot[]): Set<string> {
  return new Set(slots.map((slot) => clinicDateOf(slot.startsAt)))
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/features/appointments/lib/calendarDays.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing view tests**

Create `frontend/src/features/appointments/components/WeekView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WeekView } from './WeekView'
import type { Appointment, AvailabilitySlot } from '../types'

function appointment(id: string, startsAt: string, patientName: string): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status: 'scheduled',
    patientName,
    ownerName: 'Ana Petrović',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

const openSlot: AvailabilitySlot = {
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  isAvailable: true,
  isMine: false,
}

describe('WeekView', () => {
  it('puts an appointment in its clinic day, not its UTC day', () => {
    render(
      <WeekView
        date="2026-09-17"
        appointments={[appointment('a1', '2026-09-16T23:30:00Z', 'Luna')]}
        slots={[openSlot]}
        onAppointmentClick={vi.fn()}
        onDateSelect={vi.fn()}
        isLoading={false}
        hasSlotData
      />,
    )

    const thursday = screen.getByTestId('week-day-2026-09-17')
    expect(thursday).toHaveTextContent('Luna')
  })

  it('marks days with no slots as closed', () => {
    render(
      <WeekView
        date="2026-09-17"
        appointments={[]}
        slots={[openSlot]}
        onAppointmentClick={vi.fn()}
        onDateSelect={vi.fn()}
        isLoading={false}
        hasSlotData
      />,
    )

    expect(screen.getByTestId('week-day-2026-09-18')).toHaveTextContent('Closed')
    expect(screen.getByTestId('week-day-2026-09-17')).not.toHaveTextContent('Closed')
  })

  it('opens the day when the overflow link is used', async () => {
    const onDateSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <WeekView
        date="2026-09-17"
        appointments={[
          appointment('a1', '2026-09-17T05:00:00Z', 'Luna'),
          appointment('a2', '2026-09-17T05:30:00Z', 'Rex'),
          appointment('a3', '2026-09-17T06:00:00Z', 'Maza'),
          appointment('a4', '2026-09-17T06:30:00Z', 'Pufi'),
        ]}
        slots={[openSlot]}
        onAppointmentClick={vi.fn()}
        onDateSelect={onDateSelect}
        isLoading={false}
        hasSlotData
      />,
    )

    await user.click(screen.getByRole('button', { name: '+1 more' }))

    expect(onDateSelect).toHaveBeenCalledWith('2026-09-17')
  })
})
```

Create `frontend/src/features/appointments/components/MonthView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MonthView } from './MonthView'
import type { Appointment, AvailabilitySlot } from '../types'

function appointment(id: string, startsAt: string, patientName: string): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status: 'scheduled',
    patientName,
    ownerName: 'Ana Petrović',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

const openSlot: AvailabilitySlot = {
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  isAvailable: true,
  isMine: false,
}

function renderMonth(appointments: Appointment[]) {
  render(
    <MonthView
      date="2026-09-17"
      appointments={appointments}
      slots={[openSlot]}
      onAppointmentClick={vi.fn()}
      onDateSelect={vi.fn()}
      isLoading={false}
      hasSlotData
    />,
  )
}

describe('MonthView', () => {
  it('renders the 42-day grid', () => {
    renderMonth([])

    expect(screen.getAllByTestId(/^month-day-/)).toHaveLength(42)
  })

  it('puts an appointment in its clinic day, not its UTC day', () => {
    renderMonth([appointment('a1', '2026-09-16T23:30:00Z', 'Luna')])

    expect(screen.getByTestId('month-day-2026-09-17')).toHaveTextContent('Luna')
  })

  it('marks days with no slots as closed', () => {
    renderMonth([])

    expect(screen.getByTestId('month-day-2026-09-18')).toHaveTextContent('Closed')
    expect(screen.getByTestId('month-day-2026-09-17')).not.toHaveTextContent('Closed')
  })
})
```

- [ ] **Step 6: Run them to verify they fail**

Run: `npx vitest run src/features/appointments/components`
Expected: FAIL — modules not found.

- [ ] **Step 7: Implement the views**

Create `frontend/src/features/appointments/components/WeekView.tsx`:

```tsx
import { Skeleton } from '@/shared/ui'
import { addClinicDays, clinicToday, clinicWeekRange, clinicDateOf } from '@/shared/lib/clinicTime'
import { AppointmentChip } from './AppointmentChip'
import { groupByClinicDate, openDates } from '../lib/calendarDays'
import type { Appointment, AvailabilitySlot } from '../types'
import styles from './WeekView.module.css'

export interface WeekViewProps {
  date: string
  appointments: Appointment[]
  slots: AvailabilitySlot[]
  onAppointmentClick: (appointment: Appointment) => void
  onDateSelect: (dateIso: string) => void
  isLoading?: boolean
  hasSlotData: boolean
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const VISIBLE_CHIP_LIMIT = 3

export function WeekView({
  date,
  appointments,
  slots,
  onAppointmentClick,
  onDateSelect,
  isLoading,
  hasSlotData,
}: WeekViewProps) {
  const weekStart = clinicDateOf(clinicWeekRange(date).from)
  const days = Array.from({ length: 7 }, (_, index) => addClinicDays(weekStart, index))
  const byDate = groupByClinicDate(appointments)
  const open = openDates(slots)
  const today = clinicToday()

  return (
    <div className={styles.week}>
      {days.map((dayIso, index) => {
        const dayAppointments = byDate.get(dayIso) ?? []
        const visible = dayAppointments.slice(0, VISIBLE_CHIP_LIMIT)
        const overflowCount = dayAppointments.length - visible.length
        const isClosed = hasSlotData && !open.has(dayIso)

        return (
          <div
            key={dayIso}
            data-testid={`week-day-${dayIso}`}
            className={`${styles.dayCell} ${dayIso === today ? styles.today : ''}`}
          >
            <div className={styles.dayHeader}>
              <span>{WEEKDAY_HEADERS[index]}</span>
              <span className={styles.dayNumber}>{Number(dayIso.slice(8))}</span>
              {dayAppointments.length > 0 && (
                <span className={styles.countBadge}>{dayAppointments.length}</span>
              )}
            </div>
            {isClosed && <span className={styles.closed}>Closed</span>}
            <div className={styles.chips}>
              {isLoading ? (
                <Skeleton height="1.25rem" />
              ) : (
                <>
                  {visible.map((appointment) => (
                    <AppointmentChip
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => onAppointmentClick(appointment)}
                    />
                  ))}
                  {overflowCount > 0 && (
                    <button
                      type="button"
                      className={styles.overflow}
                      onClick={() => onDateSelect(dayIso)}
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

Create `MonthView.tsx` with the same structure, except:
- `const gridStart = clinicDateOf(clinicMonthGridRange(date).from)` and `Array.from({ length: 42 }, (_, index) => addClinicDays(gridStart, index))`
- `data-testid={`month-day-${dayIso}`}`
- days outside the current month (compare `dayIso.slice(0, 7)` with `date.slice(0, 7)`) get a `styles.otherMonth` class
- the chip limit stays 3

Recover both CSS modules from git (`git show HEAD:frontend/src/features/appointments/components/WeekView.module.css`, same for `MonthView`) and add `.closed` and, for the month, keep the existing `.otherMonth` rule if present.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/features/appointments/components`
Expected: PASS.

- [ ] **Step 9: Export the views**

Add to `frontend/src/features/appointments/index.ts`:

```ts
export { MonthView } from './components/MonthView'
export { WeekView } from './components/WeekView'
```

Run: `npx vitest run` and `npx tsc -b` and `npm run lint`
Expected: green.

---

### Task 6: Toolbar and page assembly

**Files:**
- Modify: `frontend/src/features/appointments/components/CalendarToolbar.tsx` (+ `.module.css`)
- Modify: `frontend/src/pages/AppointmentsPage.tsx`
- Test: `frontend/src/pages/AppointmentsPage.test.tsx` (new)

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: the working read-only calendar page. `CalendarToolbar` gains `showCancelled: boolean` and `onShowCancelledChange: (value: boolean) => void`, and works on clinic date strings (`currentDate: string`, `onDateChange: (dateIso: string) => void`).

- [ ] **Step 1: Write the failing page test**

Create `frontend/src/pages/AppointmentsPage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ToastProvider } from '@/shared/ui'
import { AppointmentsPage } from './AppointmentsPage'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import type { Appointment, AvailabilitySlot } from '@/features/appointments'

const slot: AvailabilitySlot = {
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  isAvailable: false,
  isMine: false,
}

const scheduled: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  patientId: 'p1',
  ownerId: 'o1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

const cancelled: Appointment = { ...scheduled, id: 'a2', status: 'cancelled', patientName: 'Rex' }

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/appointments', element: <AppointmentsPage /> }], {
    initialEntries: [path],
  })

  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  getAppointmentsSpy = vi
    .spyOn(appointmentsApi, 'getAppointments')
    .mockResolvedValue([scheduled, cancelled])
  vi.spyOn(appointmentsApi, 'getAvailability').mockResolvedValue([slot])
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
    allergies: [],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AppointmentsPage', () => {
  it('requests the day range when the day view is open', async () => {
    renderAt('/appointments?view=day&date=2026-09-17')

    await waitFor(() =>
      expect(getAppointmentsSpy).toHaveBeenCalledWith({
        from: '2026-09-16T22:00:00.000Z',
        to: '2026-09-17T22:00:00.000Z',
      }),
    )
  })

  it('requests the week range by default', async () => {
    renderAt('/appointments?date=2026-09-17')

    await waitFor(() =>
      expect(getAppointmentsSpy).toHaveBeenCalledWith({
        from: '2026-09-13T22:00:00.000Z',
        to: '2026-09-20T22:00:00.000Z',
      }),
    )
  })

  it('hides cancelled appointments until the toggle is on', async () => {
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')

    expect(await screen.findByRole('button', { name: /Luna/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rex/ })).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Show cancelled'))

    expect(await screen.findByRole('button', { name: /Rex/ })).toBeInTheDocument()
  })

  it('reports a failed load and does not claim the clinic is closed', async () => {
    vi.spyOn(appointmentsApi, 'getAvailability').mockRejectedValue(new Error('boom'))
    getAppointmentsSpy.mockRejectedValue(new Error('boom'))

    renderAt('/appointments?view=day&date=2026-09-17')

    expect(await screen.findByText('Could not load appointments')).toBeInTheDocument()
    expect(screen.queryByText('The clinic is closed on this day.')).not.toBeInTheDocument()
  })

  it('opens the detail panel with the patient summary', async () => {
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByRole('button', { name: /Luna/ }))

    expect(await screen.findByText('Chartreux')).toBeInTheDocument()
  })

  it('explains a booking with no patient', async () => {
    getAppointmentsSpy.mockResolvedValue([
      { ...scheduled, patientId: undefined, patientName: undefined },
    ])
    const user = userEvent.setup()

    renderAt('/appointments?view=day&date=2026-09-17')
    await user.click(await screen.findByRole('button', { name: /No patient yet/ }))

    expect(
      await screen.findByText('Patient not yet assigned — resolved at check-in.'),
    ).toBeInTheDocument()
  })
})
```

The last two tests depend on Tasks 7 and 8. Mark them `it.skip` for now and un-skip them in Task 8.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/pages/AppointmentsPage.test.tsx`
Expected: FAIL — the page renders no calendar.

- [ ] **Step 3: Update the toolbar**

In `frontend/src/features/appointments/components/CalendarToolbar.tsx`, change the date props to clinic date strings and add the toggle:

```tsx
export interface CalendarToolbarProps {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  currentDate: string
  onDateChange: (dateIso: string) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  showCancelled: boolean
  onShowCancelledChange: (value: boolean) => void
}
```

The `DatePicker` now takes `value={currentDate}` and `onChange={(next) => next && onDateChange(next)}`. Add before the Print button:

```tsx
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={showCancelled}
          onChange={(event) => onShowCancelledChange(event.target.checked)}
        />
        Show cancelled
      </label>
```

Add a `.toggle` rule to `CalendarToolbar.module.css` (flex row, small gap, muted text).

- [ ] **Step 4: Implement the page**

Replace `frontend/src/pages/AppointmentsPage.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useToast } from '@/shared/ui'
import {
  addClinicDays,
  addClinicMonths,
  addClinicWeeks,
  clinicDayRange,
  clinicMonthGridRange,
  clinicToday,
  clinicWeekRange,
} from '@/shared/lib/clinicTime'
import {
  CalendarToolbar,
  DayView,
  isVisible,
  MonthView,
  useAppointmentsQuery,
  useAvailabilityQuery,
  WeekView,
} from '@/features/appointments'
import type { Appointment, CalendarView } from '@/features/appointments'
import styles from './AppointmentsPage.module.css'

function isCalendarView(value: string | null): value is CalendarView {
  return value === 'day' || value === 'week' || value === 'month'
}

export function AppointmentsPage() {
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()

  const [view, setView] = useState<CalendarView>(() => {
    const param = searchParams.get('view')
    return isCalendarView(param) ? param : 'week'
  })
  const [currentDate, setCurrentDate] = useState<string>(
    () => searchParams.get('date') ?? clinicToday(),
  )
  const [showCancelled, setShowCancelled] = useState(false)
  const [selected, setSelected] = useState<Appointment | null>(null)

  const range = useMemo(() => {
    if (view === 'day') return clinicDayRange(currentDate)
    if (view === 'week') return clinicWeekRange(currentDate)
    return clinicMonthGridRange(currentDate)
  }, [view, currentDate])

  const appointmentsQuery = useAppointmentsQuery(range)
  const availabilityQuery = useAvailabilityQuery(range)

  const visible = useMemo(
    () => (appointmentsQuery.data ?? []).filter((item) => isVisible(item, showCancelled)),
    [appointmentsQuery.data, showCancelled],
  )

  const hasError = appointmentsQuery.isError || availabilityQuery.isError
  const isLoading = appointmentsQuery.isLoading || availabilityQuery.isLoading
  const slots = availabilityQuery.data ?? []
  const hasSlotData = availabilityQuery.isSuccess

  useEffect(() => {
    if (hasError) {
      showToast({ tone: 'error', title: 'Could not load appointments' })
    }
  }, [hasError, showToast])

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(addClinicDays(currentDate, -1))
    else if (view === 'week') setCurrentDate(addClinicWeeks(currentDate, -1))
    else setCurrentDate(addClinicMonths(currentDate, -1))
  }

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addClinicDays(currentDate, 1))
    else if (view === 'week') setCurrentDate(addClinicWeeks(currentDate, 1))
    else setCurrentDate(addClinicMonths(currentDate, 1))
  }

  const openDay = (dateIso: string) => {
    setCurrentDate(dateIso)
    setView('day')
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Appointment calendar — day, week, and month view.</p>
        </div>
      </div>

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(clinicToday())}
        showCancelled={showCancelled}
        onShowCancelledChange={setShowCancelled}
      />

      {hasError ? (
        <EmptyState message="Appointments could not be loaded." />
      ) : (
        <>
          {view === 'day' && (
            <DayView
              date={currentDate}
              slots={slots}
              appointments={visible}
              onAppointmentClick={setSelected}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
          {view === 'week' && (
            <WeekView
              date={currentDate}
              appointments={visible}
              slots={slots}
              onAppointmentClick={setSelected}
              onDateSelect={openDay}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
          {view === 'month' && (
            <MonthView
              date={currentDate}
              appointments={visible}
              slots={slots}
              onAppointmentClick={setSelected}
              onDateSelect={openDay}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
        </>
      )}
    </div>
  )
}
```

Import `EmptyState` alongside `useToast` from `@/shared/ui`. `selected` is unused until Task 8; keep the state and add the panel there (if lint complains about an unused setter, wire the panel in Task 8 in the same session and run lint after).

- [ ] **Step 5: Run the page tests**

Run: `npx vitest run src/pages/AppointmentsPage.test.tsx`
Expected: PASS for the four non-skipped tests.

- [ ] **Step 6: Verify everything**

Run: `npx vitest run` and `npx tsc -b` and `npm run lint`
Expected: green.

---

### Task 7: Patient summary in the patients feature

**Files:**
- Create: `frontend/src/features/patients/hooks/usePatientQuery.ts`
- Create: `frontend/src/features/patients/components/PatientSummary.tsx` (+ `.module.css`)
- Modify: `frontend/src/features/patients/index.ts`
- Test: `frontend/src/features/patients/components/PatientSummary.test.tsx`

**Interfaces:**
- Consumes: `getPatient`, `patientKeys`, `PatientDetail` (existing), `calculateAge` from `features/patients/lib/patientAge`.
- Produces: `usePatientQuery(patientId: string, enabled?: boolean)`; `<PatientSummary patientId: string />`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/patients/components/PatientSummary.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { PatientSummary } from './PatientSummary'
import * as patientsApi from '../api/patientsApi'
import { ApiError } from '@/shared/lib/apiClient'
import type { PatientDetail } from '../types'

const patient: PatientDetail = {
  id: 'p1',
  cardNumber: 'C26-57465',
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
  allergies: [{ id: 'al1', name: 'Pollen' }],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientSummary', () => {
  it('shows the record details', async () => {
    vi.spyOn(patientsApi, 'getPatient').mockResolvedValue(patient)

    render(<PatientSummary patientId="p1" />)

    expect(await screen.findByText('C26-57465')).toBeInTheDocument()
    expect(screen.getByText('Chartreux')).toBeInTheDocument()
    expect(screen.getByText('Pollen')).toBeInTheDocument()
    expect(screen.getByText('062/8890021')).toBeInTheDocument()
  })

  it('reports a failure inline', async () => {
    vi.spyOn(patientsApi, 'getPatient').mockRejectedValue(new ApiError(500, 'boom'))

    render(<PatientSummary patientId="p1" />)

    await waitFor(() =>
      expect(screen.getByText('Could not load the patient record.')).toBeInTheDocument(),
    )
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/patients/components/PatientSummary.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `frontend/src/features/patients/hooks/usePatientQuery.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { patientKeys } from '../api/patientKeys'
import { getPatient } from '../api/patientsApi'

export function usePatientQuery(patientId: string, enabled = true) {
  return useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => getPatient(patientId),
    enabled,
  })
}
```

- [ ] **Step 4: Implement the component**

Create `frontend/src/features/patients/components/PatientSummary.tsx`:

```tsx
import { Badge, Skeleton } from '@/shared/ui'
import { usePatientQuery } from '../hooks/usePatientQuery'
import { calculateAge } from '../lib/patientAge'
import styles from './PatientSummary.module.css'

export interface PatientSummaryProps {
  patientId: string
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
}

export function PatientSummary({ patientId }: PatientSummaryProps) {
  const { data, isPending, isError } = usePatientQuery(patientId)

  if (isPending) {
    return <Skeleton height="6rem" />
  }

  if (isError || !data) {
    return <p className={styles.error}>Could not load the patient record.</p>
  }

  const age = calculateAge(data.birthDate)

  return (
    <div className={styles.grid}>
      <Field label="Record no." value={data.cardNumber} />
      <Field label="Name" value={data.name} />
      <Field label="Breed" value={data.breedName} />
      <Field label="Age" value={age === undefined ? '—' : String(age)} />
      <Field label="Owner" value={data.ownerName} />
      <Field label="Phone" value={data.phoneNumber} />
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Allergies</span>
        <span className={styles.fieldValue}>
          {data.allergies.length === 0
            ? '—'
            : data.allergies.map((allergen) => (
                <Badge key={allergen.id} tone="warn">
                  {allergen.name}
                </Badge>
              ))}
        </span>
      </div>
    </div>
  )
}
```

Create `PatientSummary.module.css` with `.grid` (two-column grid), `.field`, `.fieldLabel`, `.fieldValue` and `.error`, copying the field styling from `PatientDetailPanel.module.css`.

Check `calculateAge`'s signature in `frontend/src/features/patients/lib/patientAge.ts` and adapt the `age` line if it returns something other than `number | undefined`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/features/patients/components/PatientSummary.test.tsx`
Expected: PASS.

- [ ] **Step 6: Export it**

Add to `frontend/src/features/patients/index.ts`:

```ts
export { PatientSummary } from './components/PatientSummary'
export { usePatientQuery } from './hooks/usePatientQuery'
```

Run: `npx vitest run` and `npx tsc -b`
Expected: green.

---

### Task 8: Appointment detail panel

**Files:**
- Create: `frontend/src/features/appointments/components/AppointmentDetailPanel.tsx` (+ `.module.css`)
- Modify: `frontend/src/features/appointments/index.ts`
- Modify: `frontend/src/pages/AppointmentsPage.tsx` (wire the panel and the patient slot)
- Modify: `frontend/src/pages/AppointmentsPage.test.tsx` (un-skip the last two tests)
- Test: `frontend/src/features/appointments/components/AppointmentDetailPanel.test.tsx`

**Interfaces:**
- Consumes: `Appointment`, label helpers (Task 3), `clinicDateOf`, `clinicTimeOf`, `PatientSummary` (Task 7, used by the page, not the feature).
- Produces: `<AppointmentDetailPanel appointment open onOpenChange patientSection onOpenPatientRecord? />`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/appointments/components/AppointmentDetailPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentDetailPanel } from './AppointmentDetailPanel'
import type { Appointment } from '../types'

const appointment: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: 'o1',
  patientId: 'p1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'surgery',
  status: 'checked_in',
  reason: 'limping',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

describe('AppointmentDetailPanel', () => {
  it('shows the appointment details in clinic time', () => {
    render(
      <AppointmentDetailPanel
        appointment={appointment}
        open
        onOpenChange={vi.fn()}
        patientSection={<p>patient here</p>}
      />,
    )

    expect(screen.getByText('17.09.2026')).toBeInTheDocument()
    expect(screen.getByText('07:00–07:30')).toBeInTheDocument()
    expect(screen.getByText('Surgery')).toBeInTheDocument()
    expect(screen.getByText('Checked in')).toBeInTheDocument()
    expect(screen.getByText('limping')).toBeInTheDocument()
    expect(screen.getByText('patient here')).toBeInTheDocument()
  })

  it('offers the patient record only when the callback is given', async () => {
    const onOpenPatientRecord = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <AppointmentDetailPanel
        appointment={appointment}
        open
        onOpenChange={vi.fn()}
        patientSection={<p>patient here</p>}
        onOpenPatientRecord={onOpenPatientRecord}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Patient record' }))
    expect(onOpenPatientRecord).toHaveBeenCalledTimes(1)

    rerender(
      <AppointmentDetailPanel
        appointment={appointment}
        open
        onOpenChange={vi.fn()}
        patientSection={<p>patient here</p>}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Patient record' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/appointments/components/AppointmentDetailPanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the panel**

Create `frontend/src/features/appointments/components/AppointmentDetailPanel.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Badge, Button, SlidePanel } from '@/shared/ui'
import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { partyLabel, statusLabel, statusTone, typeLabel } from '../lib/appointmentLabels'
import { WEEKDAYS } from '../lib/dateHelpers'
import type { Appointment } from '../types'
import styles from './AppointmentDetailPanel.module.css'

export interface AppointmentDetailPanelProps {
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
  patientSection: ReactNode
  onOpenPatientRecord?: () => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
}

function weekdayOf(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

export function AppointmentDetailPanel({
  appointment,
  open,
  onOpenChange,
  patientSection,
  onOpenPatientRecord,
}: AppointmentDetailPanelProps) {
  const dateIso = clinicDateOf(appointment.startsAt)
  const timeRange = `${clinicTimeOf(appointment.startsAt)}–${clinicTimeOf(appointment.endsAt)}`

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Appointment for ${partyLabel(appointment)}`}
      headerTone="accent"
      header={
        <div className={styles.header}>
          <span className={styles.avatar}>📅</span>
          <div>
            <div className={styles.name}>{partyLabel(appointment)}</div>
            <div className={styles.subtitle}>
              {weekdayOf(dateIso)}, {formatDisplayDate(dateIso)} · {timeRange}
            </div>
          </div>
        </div>
      }
      footer={
        onOpenPatientRecord ? (
          <Button variant="outline" type="button" onClick={onOpenPatientRecord}>
            Patient record
          </Button>
        ) : null
      }
    >
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Appointment</h3>
        <div className={styles.grid}>
          <Field label="Date" value={formatDisplayDate(dateIso)} />
          <Field label="Time" value={timeRange} />
          <Field label="Duration" value={`${appointment.durationMinutes} min`} />
          <Field label="Type" value={typeLabel(appointment.type)} />
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Status</span>
            <span className={styles.fieldValue}>
              <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
            </span>
          </div>
          <Field label="Created" value={formatDisplayDate(clinicDateOf(appointment.createdAt))} />
          <Field label="Reason" value={appointment.reason ?? '—'} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Patient</h3>
        {patientSection}
      </section>
    </SlidePanel>
  )
}
```

Recover the CSS module from git (`git show HEAD:frontend/src/features/appointments/components/AppointmentDetailPanel.module.css`); its `.header`, `.avatar`, `.name`, `.subtitle`, `.section`, `.sectionTitle`, `.grid`, `.field*` classes carry over unchanged.

Check `SlidePanel`'s props in `frontend/src/shared/ui/SlidePanel/SlidePanel.tsx` and match the `footer`/`headerTone` usage of `PatientDetailPanel`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/appointments/components/AppointmentDetailPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire the panel into the page**

Add the export to `frontend/src/features/appointments/index.ts`:

```ts
export { AppointmentDetailPanel } from './components/AppointmentDetailPanel'
```

In `frontend/src/pages/AppointmentsPage.tsx`, import `AppointmentDetailPanel`, `PatientSummary` from `@/features/patients`, and `useNavigate` from `react-router`, then render below the views:

```tsx
      {selected && (
        <AppointmentDetailPanel
          appointment={selected}
          open={selected !== null}
          onOpenChange={(open) => !open && setSelected(null)}
          patientSection={
            selected.patientId ? (
              <PatientSummary patientId={selected.patientId} />
            ) : (
              <div>
                <p>Patient not yet assigned — resolved at check-in.</p>
                <p>{selected.ownerName ?? 'Owner not yet assigned'}</p>
              </div>
            )
          }
          onOpenPatientRecord={
            selected.patientId
              ? () => navigate(`/patients?patient=${selected.patientId}`)
              : undefined
          }
        />
      )}
```

with `const navigate = useNavigate()` near the other hooks.

- [ ] **Step 6: Un-skip the page tests**

Remove `.skip` from the last two tests in `frontend/src/pages/AppointmentsPage.test.tsx`.

Run: `npx vitest run src/pages/AppointmentsPage.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 7: Verify everything**

Run: `npx vitest run` and `npx tsc -b` and `npm run lint`
Expected: green.

---

### Task 9: Role guard for the appointments page

**Files:**
- Create: `frontend/src/features/auth/routes/RoleRoute.tsx`
- Modify: `frontend/src/features/auth/index.ts`
- Modify: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/app/layout/AppLayout.tsx`
- Modify: `frontend/src/pages/PatientsPage.tsx`
- Test: `frontend/src/features/auth/routes/RoleRoute.test.tsx`, `frontend/src/app/layout/AppLayout.test.tsx`, and an addition to `frontend/src/pages/PatientsPage.test.tsx`

**Interfaces:**
- Consumes: `useAuth`, `UserRole` (existing).
- Produces: `<RoleRoute allow="veterinarian" />`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/features/auth/routes/RoleRoute.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { RoleRoute } from './RoleRoute'

const auth = vi.hoisted(() => ({ role: 'veterinarian' as 'veterinarian' | 'client' }))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'user@example.com', role: auth.role } }),
}))

function renderAt(role: 'veterinarian' | 'client') {
  auth.role = role

  const router = createMemoryRouter(
    [
      {
        element: <RoleRoute allow="veterinarian" />,
        children: [{ path: '/appointments', element: <p>calendar</p> }],
      },
      { path: '/patients', element: <p>patients</p> },
    ],
    { initialEntries: ['/appointments'] },
  )

  render(<RouterProvider router={router} />)
}

describe('RoleRoute', () => {
  it('renders the route for the allowed role', () => {
    renderAt('veterinarian')

    expect(screen.getByText('calendar')).toBeInTheDocument()
  })

  it('redirects everyone else to patients', () => {
    renderAt('client')

    expect(screen.getByText('patients')).toBeInTheDocument()
  })
})
```

Create `frontend/src/app/layout/AppLayout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppLayout } from './AppLayout'

const auth = vi.hoisted(() => ({ role: 'veterinarian' as 'veterinarian' | 'client' }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { userId: 'u1', email: 'user@example.com', role: auth.role },
    logout: vi.fn(),
  }),
}))

function renderLayout(role: 'veterinarian' | 'client') {
  auth.role = role

  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: '/patients', element: <p>patients</p> }] }],
    { initialEntries: ['/patients'] },
  )

  render(<RouterProvider router={router} />)
}

describe('AppLayout navigation', () => {
  it('shows the appointments link to a vet', () => {
    renderLayout('veterinarian')

    expect(screen.getByRole('link', { name: 'Appointments' })).toBeInTheDocument()
  })

  it('hides it from a client', () => {
    renderLayout('client')

    expect(screen.queryByRole('link', { name: 'Appointments' })).not.toBeInTheDocument()
  })
})
```

Add to the "PatientsPage for a client" block in `frontend/src/pages/PatientsPage.test.tsx`:

```tsx
  it('hides the clinic-wide appointment tiles', async () => {
    renderAt('/patients')

    expect(await screen.findByText(/Rex/)).toBeInTheDocument()
    expect(screen.queryByText('Scheduled today')).not.toBeInTheDocument()
    expect(screen.queryByText('Peak hour')).not.toBeInTheDocument()
  })
```

Match the tile titles to the actual text rendered by `ScheduledTodayTile` and `PeakHourTile`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/features/auth src/app src/pages/PatientsPage.test.tsx`
Expected: FAIL — `RoleRoute` not found; the nav and tiles render for everyone.

- [ ] **Step 3: Implement RoleRoute**

Create `frontend/src/features/auth/routes/RoleRoute.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

export interface RoleRouteProps {
  allow: UserRole
}

export function RoleRoute({ allow }: RoleRouteProps) {
  const { user } = useAuth()

  if (user?.role !== allow) {
    return <Navigate to="/patients" replace />
  }

  return <Outlet />
}
```

Add to `frontend/src/features/auth/index.ts`:

```ts
export { RoleRoute } from './routes/RoleRoute'
```

- [ ] **Step 4: Guard the route and the nav**

In `frontend/src/app/routes.tsx`, wrap the appointments route:

```tsx
          { path: '/patients', element: <PatientsPage /> },
          {
            element: <RoleRoute allow="veterinarian" />,
            children: [{ path: '/appointments', element: <AppointmentsPage /> }],
          },
```

with `RoleRoute` added to the `@/features/auth` import.

In `frontend/src/app/layout/AppLayout.tsx`, wrap the Appointments `NavLink`:

```tsx
            {user?.role === 'veterinarian' && (
              <NavLink
                to="/appointments"
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                Appointments
              </NavLink>
            )}
```

In `frontend/src/pages/PatientsPage.tsx`, render the clinic-wide tiles only for a vet:

```tsx
      <StatGrid>
        <TotalPatientsTile />
        {isVeterinarian && <PeakHourTile onOpenBreakdown={() => setPeakHoursOpen(true)} />}
        {isVeterinarian && <ScheduledTodayTile />}
      </StatGrid>
```

and render `<PeakHoursPanel … />` only when `isVeterinarian`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/features/auth src/app src/pages`
Expected: PASS.

- [ ] **Step 6: Final verification**

Run: `npx vitest run` then `npx tsc -b` then `npm run build` then `npm run lint`
Expected: all green; lint reports no new warnings beyond the 4 pre-existing ones.

- [ ] **Step 7: Check it in the running app**

With the backend running (`docker compose up -d`), log in as a vet and confirm: the week view loads, the day view shows 30-minute rows from 07:00 to 19:30, "Show cancelled" reveals cancelled bookings, clicking a chip opens the panel with the patient summary, and the dashboard tiles show real numbers. If there are no appointments yet, create a few with `POST /appointments` (via Swagger or curl) so the views have data.
