# Layered feature-driven structure — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this
> plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `pages/` and `widgets/` layers, break the patients/appointments dependency
cycle, and rebuild the dashboard as independent tiles that read the features' query caches.

**Architecture:** Five layers, each importing only downward: `app -> pages -> widgets -> features
-> shared`. The dashboard becomes a widget of self-contained tiles, each reading one hook per figure
it renders, so a data source can be swapped without touching a tile.

**Tech Stack:** React 19, TypeScript, Vite 8, `@tanstack/react-query` 5.102.8, Vitest 4 +
Testing Library, oxlint.

**Spec:** `docs/superpowers/specs/2026-08-29-frontend-layered-structure-design.md`

## Global Constraints

- **No code comments.** The repo owner adds their own.
- **No git commits.** The repo owner commits their own work. Never run `git add` or `git commit`.
  Tasks end at "verify".
- Use `git mv` for file moves so history is preserved.
- A layer imports only from layers strictly below it. No sideways imports at any level.
- Mock-backed data lives in files whose names begin with `mock`. Do not replace any mock with a
  real endpoint; only the patients endpoints exist.
- `AppointmentsPage` is not touched. It keeps its `useEffect` and only gains a sibling hook.
- Do not run `npm run format` — the repo has pre-existing Prettier drift in 113 files, unrelated to
  this work. Format only the files you create.
- Every task ends with `npm run test` green.

## File Structure

| File                                                    | Responsibility                             |
| ------------------------------------------------------- | ------------------------------------------ |
| `src/shared/domain/species.ts` (new)                     | `Species` union and `SPECIES_EMOJI`        |
| `src/features/appointments/api/appointmentKeys.ts` (new) | Appointment query keys                     |
| `src/features/appointments/hooks/useAppointmentsQuery.ts` (new) | Appointment list read hook          |
| `src/features/patients/hooks/useActivePatientCount.ts` (new) | Active count, source detail hidden     |
| `src/widgets/dashboard/lib/appointmentStats.ts` (new)    | Pure derivation over `Appointment[]`       |
| `src/widgets/dashboard/hooks/*.ts` (new)                 | One hook per rendered figure               |
| `src/widgets/dashboard/components/*.tsx` (new)           | Layout-only grid, card shell, tiles        |
| `src/pages/*` (new)                                      | The four route components                  |
| `src/features/patients/api/statsApi.ts`                  | Deleted                                    |
| `src/features/patients/lib/speciesEmoji.ts`              | Deleted                                    |

---

### Task 1: Move the species vocabulary into shared

Kills the `appointments -> patients` edge.

**Files:**

- Create: `frontend/src/shared/domain/species.ts`
- Delete: `frontend/src/features/patients/lib/speciesEmoji.ts`
- Modify: `frontend/src/features/patients/types.ts:1`
- Modify: `frontend/src/features/patients/index.ts:3`
- Modify: `frontend/src/features/patients/components/PatientTable.tsx:4`
- Modify: `frontend/src/features/patients/components/PatientDetailPanel.tsx:5`
- Modify: `frontend/src/features/appointments/components/AppointmentChip.tsx:1`
- Modify: `frontend/src/features/appointments/components/AppointmentDetailPanel.tsx:3`
- Modify: `frontend/src/features/appointments/components/AppointmentFormPanel.tsx:3`
- Modify: `frontend/src/features/appointments/api/mockPatients.ts:1`

**Interfaces:**

- Produces: `Species` (`'dog' | 'cat' | 'bird' | 'other'`) and
  `SPECIES_EMOJI: Record<Species, string>`, both from `@/shared/domain/species`.

- [ ] **Step 1: Create the shared module**

Create `frontend/src/shared/domain/species.ts`:

```ts
export type Species = 'dog' | 'cat' | 'bird' | 'other'

export const SPECIES_EMOJI: Record<Species, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  other: '🐾',
}
```

- [ ] **Step 2: Re-export the type from the patients types module**

`features/patients/types.ts` uses `Species` locally on lines 31, 56, 73 and 119, and other patients
files import it from `'../types'`. Replace line 1 (`export type Species = ...`) with both an import
for local use and a re-export for consumers:

```ts
import type { Species } from '@/shared/domain/species'

export type { Species }
```

Nothing else in that file changes, and the roughly twenty patients files importing `Species` from
`'../types'` keep working untouched.

- [ ] **Step 3: Point the emoji consumers at shared**

Delete `frontend/src/features/patients/lib/speciesEmoji.ts`.

In `features/patients/components/PatientTable.tsx` and
`features/patients/components/PatientDetailPanel.tsx`, replace the
`import { SPECIES_EMOJI } from '../lib/speciesEmoji'` line with:

```ts
import { SPECIES_EMOJI } from '@/shared/domain/species'
```

In `features/appointments/components/AppointmentChip.tsx`,
`AppointmentDetailPanel.tsx` and `AppointmentFormPanel.tsx`, replace
`import { SPECIES_EMOJI } from '@/features/patients'` with the same line.

In `features/appointments/api/mockPatients.ts`, replace
`import type { Species } from '@/features/patients'` with:

```ts
import type { Species } from '@/shared/domain/species'
```

- [ ] **Step 4: Drop the emoji from the patients barrel**

In `features/patients/index.ts`, delete the line
`export { SPECIES_EMOJI } from './lib/speciesEmoji'`. Leave the rest of the barrel alone for now.

- [ ] **Step 5: Verify the edge is gone**

Run: `npx oxlint --import-plugin -D import/no-cycle src/features`
Expected: zero errors, down from 11.

Note that zero here does not mean the layering is clean. A cycle needs an edge in both directions,
so removing one direction satisfies the rule while a one-way cross-feature import survives. The
honest check is:

Run: `grep -rn "from '@/features/" --include=*.ts --include=*.tsx src/features | grep -v "features/auth/.*@/features/auth"`
Expected: exactly one hit, `features/patients/api/statsApi.ts` importing appointments. Task 5
removes it.

Run: `npm run test`
Expected: 150 passed.

Run: `npx tsc -b`
Expected: no output.

---

### Task 2: Give appointments a query hook

**Files:**

- Create: `frontend/src/features/appointments/api/appointmentKeys.ts`
- Create: `frontend/src/features/appointments/hooks/useAppointmentsQuery.ts`
- Create: `frontend/src/features/appointments/hooks/useAppointmentsQuery.test.ts`
- Modify: `frontend/src/features/appointments/index.ts`

**Interfaces:**

- Consumes: `getAppointments(): Promise<Appointment[]>` from `../api/appointmentsApi`;
  `QueryWrapper` from `@/test/renderWithQuery`.
- Produces: `appointmentKeys` with `.all` and `.list()`;
  `useAppointmentsQuery(enabled?: boolean)` returning a standard Query result whose `data` is
  `Appointment[] | undefined`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/appointments/hooks/useAppointmentsQuery.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as appointmentsApi from '../api/appointmentsApi'
import { appointmentKeys } from '../api/appointmentKeys'
import { useAppointmentsQuery } from './useAppointmentsQuery'

const appointment = {
  id: 'a1',
  patientId: 'p1',
  date: '2026-08-29',
  time: '09:30',
  type: 'checkup' as const,
  reminderEnabled: false,
  attachments: [],
}

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  getAppointmentsSpy = vi
    .spyOn(appointmentsApi, 'getAppointments')
    .mockResolvedValue([appointment])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('appointmentKeys', () => {
  it('prefixes the list so one invalidation clears it', () => {
    expect(appointmentKeys.list().slice(0, 1)).toEqual([...appointmentKeys.all])
  })
})

describe('useAppointmentsQuery', () => {
  it('returns the appointment list', async () => {
    const { result } = renderHook(() => useAppointmentsQuery(), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.data).toEqual([appointment]))
  })

  it('shares one request between callers', async () => {
    renderHook(
      () => {
        useAppointmentsQuery()
        useAppointmentsQuery()
      },
      { wrapper: QueryWrapper },
    )

    await waitFor(() => expect(getAppointmentsSpy).toHaveBeenCalledTimes(1))
  })

  it('does not fetch while disabled', async () => {
    renderHook(() => useAppointmentsQuery(false), { wrapper: QueryWrapper })

    await waitFor(() => expect(getAppointmentsSpy).not.toHaveBeenCalled())
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- useAppointmentsQuery`
Expected: FAIL — cannot resolve `../api/appointmentKeys` or `./useAppointmentsQuery`.

- [ ] **Step 3: Create the key factory**

Create `frontend/src/features/appointments/api/appointmentKeys.ts`:

```ts
export const appointmentKeys = {
  all: ['appointments'] as const,
  list: () => [...appointmentKeys.all, 'list'] as const,
}
```

- [ ] **Step 4: Create the hook**

Create `frontend/src/features/appointments/hooks/useAppointmentsQuery.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAppointments } from '../api/appointmentsApi'

export function useAppointmentsQuery(enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.list(),
    queryFn: getAppointments,
    enabled,
  })
}
```

- [ ] **Step 5: Export from the barrel**

Add to `features/appointments/index.ts`:

```ts
export { appointmentKeys } from './api/appointmentKeys'
export { useAppointmentsQuery } from './hooks/useAppointmentsQuery'
```

- [ ] **Step 6: Run the tests**

Run: `npm run test -- useAppointmentsQuery`
Expected: PASS, 4 tests.

Run: `npm run test`
Expected: 154 passed.

---

### Task 3: Give patients an active-count hook

**Files:**

- Create: `frontend/src/features/patients/hooks/useActivePatientCount.ts`
- Create: `frontend/src/features/patients/hooks/useActivePatientCount.test.ts`
- Modify: `frontend/src/features/patients/index.ts`

**Interfaces:**

- Consumes: `patientKeys` from `../api/patientKeys`; `getPatients(filters, page, pageSize)` from
  `../api/patientsApi`; `PatientFilters` from `../types`.
- Produces: `useActivePatientCount(): { count: number; isPending: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/patients/hooks/useActivePatientCount.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as patientsApi from '../api/patientsApi'
import { useActivePatientCount } from './useActivePatientCount'

beforeEach(() => {
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
    items: [],
    totalCount: 25,
    page: 1,
    pageSize: 10,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useActivePatientCount', () => {
  it('reports the total count of active patients', async () => {
    const { result } = renderHook(() => useActivePatientCount(), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.count).toBe(25)
  })

  it('requests only active patients', async () => {
    renderHook(() => useActivePatientCount(), { wrapper: QueryWrapper })

    await waitFor(() =>
      expect(patientsApi.getPatients).toHaveBeenCalledWith({ status: 'active' }, 1, 10),
    )
  })

  it('reports zero while still loading', () => {
    const { result } = renderHook(() => useActivePatientCount(), { wrapper: QueryWrapper })

    expect(result.current.isPending).toBe(true)
    expect(result.current.count).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- useActivePatientCount`
Expected: FAIL — cannot resolve `./useActivePatientCount`.

- [ ] **Step 3: Create the hook**

Create `frontend/src/features/patients/hooks/useActivePatientCount.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { patientKeys } from '../api/patientKeys'
import { getPatients } from '../api/patientsApi'
import type { PatientFilters } from '../types'

const ACTIVE_FILTERS: PatientFilters = { status: 'active' }
const ACTIVE_PAGE = 1
const ACTIVE_PAGE_SIZE = 10

export interface ActivePatientCount {
  count: number
  isPending: boolean
}

export function useActivePatientCount(): ActivePatientCount {
  const { data, isPending } = useQuery({
    queryKey: patientKeys.list(ACTIVE_FILTERS, ACTIVE_PAGE, ACTIVE_PAGE_SIZE),
    queryFn: () => getPatients(ACTIVE_FILTERS, ACTIVE_PAGE, ACTIVE_PAGE_SIZE),
  })

  return { count: data?.totalCount ?? 0, isPending }
}
```

The page size of 10 matches what `statsApi` requested, and the backend clamps anything outside
`[1, 100]` to 10 regardless. Keeping it at 10 means this query reuses the same cache entry shape the
old code produced.

- [ ] **Step 4: Widen the patients barrel**

Replace the whole of `features/patients/index.ts`:

```ts
export { PatientDetailPanel } from './components/PatientDetailPanel'
export { PatientFilters } from './components/PatientFilters'
export { PatientFormPanel } from './components/PatientFormPanel'
export { PatientTable } from './components/PatientTable'
export { patientKeys } from './api/patientKeys'
export { deletePatient, getPatient, getPatients } from './api/patientsApi'
export { useActivePatientCount } from './hooks/useActivePatientCount'
export { useAllergenByName, usePatientsQuery } from './hooks/usePatientsQuery'
export { parseFilterParams, toFilterParams } from './lib/patientFilterParams'
export type {
  PatientDetail,
  PatientFilters as PatientFiltersType,
  PatientListItem,
  PatientPage,
} from './types'
```

`PatientsPage` is no longer exported; Task 6 moves it to `pages/`. Until then `app/routes.tsx`
still imports it, so this step will break the build. That is expected and Task 6 repairs it; the
tests in step 5 do not import the barrel and still pass.

- [ ] **Step 5: Run the tests**

Run: `npm run test -- useActivePatientCount`
Expected: PASS, 3 tests.

Run: `npm run test`
Expected: 157 passed.

Note: `npx tsc -b` fails at this point because `app/routes.tsx` imports `PatientsPage` from the
barrel. Do not fix it here. Task 6 moves the page and updates the route.

---

### Task 4: Extract the appointment statistics as pure functions

**Files:**

- Create: `frontend/src/widgets/dashboard/lib/appointmentStats.ts`
- Create: `frontend/src/widgets/dashboard/lib/appointmentStats.test.ts`

**Interfaces:**

- Consumes: `Appointment` and `WEEKDAYS` from `@/features/appointments`; `parseDateOnly` from
  `@/shared/lib/dateOnly`.
- Produces: `HourCount` (`{ hour: string; count: number }`), `DayBreakdown`
  (`{ day: string; total: number; peakHour: HourCount | null }`), `PEAK_HOURS_RANGE: string[]`,
  `hourBucket(time: string): string`, `countByHour(appointments: Appointment[]): Map<string, number>`,
  `peakOf(counts: Map<string, number>): HourCount | null`,
  `appointmentsOn(appointments: Appointment[], dateIso: string): Appointment[]`,
  `hourHistogram(appointments: Appointment[]): HourCount[]`,
  `dayBreakdown(appointments: Appointment[]): DayBreakdown[]`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/widgets/dashboard/lib/appointmentStats.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Appointment } from '@/features/appointments'
import {
  appointmentsOn,
  countByHour,
  dayBreakdown,
  hourBucket,
  hourHistogram,
  peakOf,
  PEAK_HOURS_RANGE,
} from './appointmentStats'

function makeAppointment(date: string, time: string, id = `${date}-${time}`): Appointment {
  return {
    id,
    patientId: 'p1',
    date,
    time,
    type: 'checkup',
    reminderEnabled: false,
    attachments: [],
  }
}

describe('hourBucket', () => {
  it('pads single-digit hours', () => {
    expect(hourBucket('9:30')).toBe('09:00')
  })

  it('drops the minutes', () => {
    expect(hourBucket('14:45')).toBe('14:00')
  })
})

describe('peakOf', () => {
  it('returns null for no appointments', () => {
    expect(peakOf(new Map())).toBeNull()
  })

  it('returns the busiest hour', () => {
    const counts = new Map([
      ['09:00', 2],
      ['11:00', 5],
    ])
    expect(peakOf(counts)).toEqual({ hour: '11:00', count: 5 })
  })

  it('keeps the first hour when counts tie', () => {
    const counts = new Map([
      ['09:00', 3],
      ['11:00', 3],
    ])
    expect(peakOf(counts)).toEqual({ hour: '09:00', count: 3 })
  })
})

describe('countByHour', () => {
  it('groups appointments into hourly buckets', () => {
    const counts = countByHour([
      makeAppointment('2026-08-29', '09:15'),
      makeAppointment('2026-08-29', '09:45'),
      makeAppointment('2026-08-29', '13:00'),
    ])

    expect(counts.get('09:00')).toBe(2)
    expect(counts.get('13:00')).toBe(1)
  })
})

describe('appointmentsOn', () => {
  it('keeps only the given date', () => {
    const result = appointmentsOn(
      [makeAppointment('2026-08-29', '09:00'), makeAppointment('2026-08-30', '09:00')],
      '2026-08-29',
    )

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-08-29')
  })
})

describe('hourHistogram', () => {
  it('covers 07:00 through 20:00 inclusive', () => {
    expect(PEAK_HOURS_RANGE[0]).toBe('07:00')
    expect(PEAK_HOURS_RANGE[PEAK_HOURS_RANGE.length - 1]).toBe('20:00')
    expect(hourHistogram([])).toHaveLength(14)
  })

  it('reports zero for hours with no appointments', () => {
    const histogram = hourHistogram([makeAppointment('2026-08-29', '09:00')])

    expect(histogram.find((entry) => entry.hour === '09:00')?.count).toBe(1)
    expect(histogram.find((entry) => entry.hour === '10:00')?.count).toBe(0)
  })
})

describe('dayBreakdown', () => {
  it('orders the week Monday first and Sunday last', () => {
    const days = dayBreakdown([]).map((entry) => entry.day)

    expect(days[0]).toBe('Monday')
    expect(days[6]).toBe('Sunday')
  })

  it('totals and peaks each day independently', () => {
    const days = dayBreakdown([
      makeAppointment('2026-08-31', '09:00', 'mon-1'),
      makeAppointment('2026-08-31', '09:30', 'mon-2'),
      makeAppointment('2026-09-01', '15:00', 'tue-1'),
    ])

    const monday = days.find((entry) => entry.day === 'Monday')
    const tuesday = days.find((entry) => entry.day === 'Tuesday')

    expect(monday?.total).toBe(2)
    expect(monday?.peakHour).toEqual({ hour: '09:00', count: 2 })
    expect(tuesday?.total).toBe(1)
  })
})
```

2026-08-31 is a Monday and 2026-09-01 a Tuesday; the assertions depend on that.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- appointmentStats`
Expected: FAIL — cannot resolve `./appointmentStats`.

- [ ] **Step 3: Create the module**

Create `frontend/src/widgets/dashboard/lib/appointmentStats.ts`:

```ts
import { WEEKDAYS } from '@/features/appointments'
import type { Appointment } from '@/features/appointments'
import { parseDateOnly } from '@/shared/lib/dateOnly'

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
  { length: 14 },
  (_, index) => `${String(index + 7).padStart(2, '0')}:00`,
)

const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function hourBucket(time: string): string {
  return `${time.split(':')[0].padStart(2, '0')}:00`
}

export function countByHour(appointments: Appointment[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const appointment of appointments) {
    const hour = hourBucket(appointment.time)
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
  return appointments.filter((appointment) => appointment.date === dateIso)
}

export function hourHistogram(appointments: Appointment[]): HourCount[] {
  const counts = countByHour(appointments)
  return PEAK_HOURS_RANGE.map((hour) => ({ hour, count: counts.get(hour) ?? 0 }))
}

export function dayBreakdown(appointments: Appointment[]): DayBreakdown[] {
  return MONDAY_FIRST_ORDER.map((weekdayIndex) => {
    const forDay = appointments.filter(
      (appointment) => parseDateOnly(appointment.date).getDay() === weekdayIndex,
    )
    return {
      day: WEEKDAYS[weekdayIndex],
      total: forDay.length,
      peakHour: peakOf(countByHour(forDay)),
    }
  })
}
```

- [ ] **Step 4: Run the tests**

Run: `npm run test -- appointmentStats`
Expected: PASS, 11 tests.

Run: `npm run test`
Expected: 168 passed.

---

### Task 5: Build the dashboard widget and delete statsApi

Kills the `patients -> appointments` edge, completing the cycle removal.

**Files:**

- Create: `frontend/src/widgets/dashboard/hooks/useTodayAppointmentCount.ts`
- Create: `frontend/src/widgets/dashboard/hooks/usePeakHourToday.ts`
- Create: `frontend/src/widgets/dashboard/hooks/usePeakHoursBreakdown.ts`
- Create: `frontend/src/widgets/dashboard/components/StatGrid.tsx`
- Create: `frontend/src/widgets/dashboard/components/StatCard.tsx`
- Create: `frontend/src/widgets/dashboard/components/TotalPatientsTile.tsx`
- Create: `frontend/src/widgets/dashboard/components/PeakHourTile.tsx`
- Create: `frontend/src/widgets/dashboard/components/ScheduledTodayTile.tsx`
- Create: `frontend/src/widgets/dashboard/components/StatCards.module.css` (moved)
- Create: `frontend/src/widgets/dashboard/index.ts`
- Create: `frontend/src/widgets/dashboard/components/DashboardTiles.test.tsx`
- Move: `PeakHoursPanel.tsx` and `PeakHoursPanel.module.css` into
  `frontend/src/widgets/dashboard/components/`
- Delete: `frontend/src/features/patients/api/statsApi.ts`
- Modify: `frontend/src/features/patients/hooks/usePatientsQuery.ts` — remove `useDashboardStats`
- Delete: `frontend/src/features/patients/components/StatCards.tsx`
- Modify: `frontend/src/features/patients/pages/PatientsPage.tsx`
- Modify: `frontend/src/features/patients/pages/PatientsPage.test.tsx`

**Interfaces:**

- Consumes: `useAppointmentsQuery` and `WEEKDAYS` from `@/features/appointments`;
  `useActivePatientCount` and `patientKeys` from `@/features/patients`; everything Task 4 produced;
  `todayIso` from `@/shared/lib/dateOnly`; `Skeleton` from `@/shared/ui`.
- Produces: `StatGrid`, `StatCard`, `TotalPatientsTile`, `PeakHourTile`, `ScheduledTodayTile`,
  `PeakHoursPanel` from `@/widgets/dashboard`.

- [ ] **Step 1: Move the two files that transfer unchanged**

```bash
git mv frontend/src/features/patients/components/PeakHoursPanel.tsx frontend/src/widgets/dashboard/components/PeakHoursPanel.tsx
git mv frontend/src/features/patients/components/PeakHoursPanel.module.css frontend/src/widgets/dashboard/components/PeakHoursPanel.module.css
git mv frontend/src/features/patients/components/StatCards.module.css frontend/src/widgets/dashboard/components/StatCards.module.css
```

Create the `hooks` and `lib` directories first if `git mv` complains the destination is missing.

- [ ] **Step 2: Create the three widget hooks**

Create `frontend/src/widgets/dashboard/hooks/useTodayAppointmentCount.ts`:

```ts
import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { todayIso } from '@/shared/lib/dateOnly'
import { appointmentsOn } from '../lib/appointmentStats'

export function useTodayAppointmentCount(): { count: number; isPending: boolean } {
  const { data, isPending } = useAppointmentsQuery()

  const count = useMemo(() => (data ? appointmentsOn(data, todayIso()).length : 0), [data])

  return { count, isPending }
}
```

Create `frontend/src/widgets/dashboard/hooks/usePeakHourToday.ts`:

```ts
import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { todayIso } from '@/shared/lib/dateOnly'
import { appointmentsOn, countByHour, peakOf, type HourCount } from '../lib/appointmentStats'

export function usePeakHourToday(): { peakHour: HourCount | null; isPending: boolean } {
  const { data, isPending } = useAppointmentsQuery()

  const peakHour = useMemo(
    () => (data ? peakOf(countByHour(appointmentsOn(data, todayIso()))) : null),
    [data],
  )

  return { peakHour, isPending }
}
```

Create `frontend/src/widgets/dashboard/hooks/usePeakHoursBreakdown.ts`:

```ts
import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import {
  countByHour,
  dayBreakdown,
  hourHistogram,
  peakOf,
  type DayBreakdown,
  type HourCount,
} from '../lib/appointmentStats'

export interface PeakHoursBreakdown {
  peakHour: HourCount | null
  busiestDay: DayBreakdown | null
  averagePerDay: number
  totalAppointments: number
  byHour: HourCount[]
  byDay: DayBreakdown[]
}

export function usePeakHoursBreakdown(enabled: boolean): PeakHoursBreakdown | null {
  const { data } = useAppointmentsQuery(enabled)

  return useMemo(() => {
    if (!data) return null

    const byDay = dayBreakdown(data)
    const busiestDay = byDay.reduce<DayBreakdown | null>(
      (best, day) => (day.total > 0 && (!best || day.total > best.total) ? day : best),
      null,
    )

    return {
      peakHour: peakOf(countByHour(data)),
      busiestDay,
      averagePerDay: Math.round((data.length / 7) * 10) / 10,
      totalAppointments: data.length,
      byHour: hourHistogram(data),
      byDay,
    }
  }, [data])
}
```

- [ ] **Step 3: Create the layout and card shell**

Create `frontend/src/widgets/dashboard/components/StatGrid.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './StatCards.module.css'

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}
```

Create `frontend/src/widgets/dashboard/components/StatCard.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Skeleton } from '@/shared/ui'
import styles from './StatCards.module.css'

export interface StatCardBodyProps {
  icon: string
  label: string
  isLoading: boolean
  children: ReactNode
}

export function StatCardBody({ icon, label, isLoading, children }: StatCardBodyProps) {
  return (
    <>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      {isLoading ? <Skeleton width="3rem" height="1.6rem" /> : children}
    </>
  )
}
```

Do not re-export the stylesheet from this file. Each tile imports
`./StatCards.module.css` directly. Exporting a non-component alongside a component would trip
oxlint's `react/only-export-components`, and Task 7 requires that exactly two such warnings exist in
the whole repo.

- [ ] **Step 4: Create the three tiles**

Create `frontend/src/widgets/dashboard/components/TotalPatientsTile.tsx`:

```tsx
import { useActivePatientCount } from '@/features/patients'
import { StatCardBody } from './StatCard'
import styles from './StatCards.module.css'

export function TotalPatientsTile() {
  const { count, isPending } = useActivePatientCount()

  return (
    <div className={styles.card}>
      <StatCardBody icon="🐾" label="TOTAL PATIENTS" isLoading={isPending}>
        <span className={styles.value}>{count}</span>
      </StatCardBody>
    </div>
  )
}
```

Create `frontend/src/widgets/dashboard/components/PeakHourTile.tsx`:

```tsx
import { usePeakHourToday } from '../hooks/usePeakHourToday'
import { useTodayAppointmentCount } from '../hooks/useTodayAppointmentCount'
import { StatCardBody } from './StatCard'
import styles from './StatCards.module.css'

export interface PeakHourTileProps {
  onOpenBreakdown: () => void
}

export function PeakHourTile({ onOpenBreakdown }: PeakHourTileProps) {
  const { peakHour, isPending } = usePeakHourToday()
  const { count } = useTodayAppointmentCount()

  return (
    <button
      type="button"
      className={`${styles.card} ${styles.cardButton} ${styles.cardClickable}`}
      onClick={onOpenBreakdown}
    >
      <StatCardBody icon="⏰" label="PEAK HOUR" isLoading={isPending}>
        <>
          <span className={styles.value}>{peakHour?.hour ?? '—'}</span>
          {peakHour && (
            <span className={styles.sublabel}>
              {peakHour.count} of {count} appointments
            </span>
          )}
        </>
      </StatCardBody>
    </button>
  )
}
```

Create `frontend/src/widgets/dashboard/components/ScheduledTodayTile.tsx`:

```tsx
import { Link } from 'react-router'
import { todayIso } from '@/shared/lib/dateOnly'
import { useTodayAppointmentCount } from '../hooks/useTodayAppointmentCount'
import { StatCardBody } from './StatCard'
import styles from './StatCards.module.css'

export function ScheduledTodayTile() {
  const { count, isPending } = useTodayAppointmentCount()

  return (
    <Link
      to={`/appointments?view=day&date=${todayIso()}`}
      className={`${styles.card} ${styles.cardClickable}`}
    >
      <StatCardBody icon="📅" label="SCHEDULED TODAY" isLoading={isPending}>
        <span className={styles.value}>{count}</span>
      </StatCardBody>
    </Link>
  )
}
```

- [ ] **Step 5: Rewire PeakHoursPanel onto its hook**

In `frontend/src/widgets/dashboard/components/PeakHoursPanel.tsx`, replace the `useState` and
`useEffect` data block (the `const [data, setData] = useState<PeakHoursBreakdown | null>(null)` and
the effect that calls `getPeakHoursBreakdown`) with:

```tsx
const data = usePeakHoursBreakdown(open)
```

Replace the import of `getPeakHoursBreakdown` and its types from `'../api/statsApi'` with:

```tsx
import { usePeakHoursBreakdown } from '../hooks/usePeakHoursBreakdown'
import type { DayBreakdown, HourCount } from '../lib/appointmentStats'
```

The file used the name `HourBreakdown`; it is now `HourCount`. Rename the two usages in the
`HourRow` prop type. Everything below the data block, including `maxHourCount` and `maxDayTotal`,
stays as it is.

- [ ] **Step 6: Create the barrel**

Create `frontend/src/widgets/dashboard/index.ts`:

```ts
export { StatGrid } from './components/StatGrid'
export { TotalPatientsTile } from './components/TotalPatientsTile'
export { PeakHourTile } from './components/PeakHourTile'
export { ScheduledTodayTile } from './components/ScheduledTodayTile'
export { PeakHoursPanel } from './components/PeakHoursPanel'
```

- [ ] **Step 7: Delete the old stats code**

Delete `frontend/src/features/patients/api/statsApi.ts` and
`frontend/src/features/patients/components/StatCards.tsx`.

In `frontend/src/features/patients/hooks/usePatientsQuery.ts`, delete the `useDashboardStats`
function and its `getDashboardStats` import. `useAllergenByName` and `usePatientsQuery` stay.

- [ ] **Step 8: Rewire PatientsPage**

In `frontend/src/features/patients/pages/PatientsPage.tsx`:

Replace the `StatCards` and `PeakHoursPanel` imports and the `useDashboardStats` import with:

```tsx
import {
  PeakHoursPanel,
  PeakHourTile,
  ScheduledTodayTile,
  StatGrid,
  TotalPatientsTile,
} from '@/widgets/dashboard'
import { useAllergenByName, usePatientsQuery } from '../hooks/usePatientsQuery'
```

Delete the `const statsQuery = useDashboardStats()` line.

Replace the `<StatCards ... />` element with:

```tsx
<StatGrid>
  <TotalPatientsTile />
  <PeakHourTile onOpenBreakdown={() => setPeakHoursOpen(true)} />
  <ScheduledTodayTile />
</StatGrid>
```

Delete the second invalidation from `afterWrite`, leaving:

```tsx
const afterWrite = (title: string) => {
  closePanel()
  queryClient.invalidateQueries({ queryKey: patientKeys.all })
  showToast({ tone: 'success', title })
}
```

- [ ] **Step 9: Update the page test's stubs**

In `frontend/src/features/patients/pages/PatientsPage.test.tsx`, delete the
`import * as statsApi from '../api/statsApi'` line and the
`vi.spyOn(statsApi, 'getDashboardStats').mockResolvedValue({...})` block in `beforeEach`.

Add in their place:

```tsx
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
```

and inside `beforeEach`:

```tsx
vi.spyOn(appointmentsApi, 'getAppointments').mockResolvedValue([])
```

The tiles now reach appointments directly, so the page test must stub that instead of the deleted
stats module.

- [ ] **Step 10: Write the tile tests**

Create `frontend/src/widgets/dashboard/components/DashboardTiles.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery } from '@/test/renderWithQuery'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import { todayIso } from '@/shared/lib/dateOnly'
import { PeakHourTile } from './PeakHourTile'
import { ScheduledTodayTile } from './ScheduledTodayTile'
import { TotalPatientsTile } from './TotalPatientsTile'

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
    items: [],
    totalCount: 42,
    page: 1,
    pageSize: 10,
  })
  getAppointmentsSpy = vi.spyOn(appointmentsApi, 'getAppointments').mockResolvedValue([
    {
      id: 'a1',
      patientId: 'p1',
      date: todayIso(),
      time: '09:15',
      type: 'checkup',
      reminderEnabled: false,
      attachments: [],
    },
    {
      id: 'a2',
      patientId: 'p2',
      date: todayIso(),
      time: '09:45',
      type: 'checkup',
      reminderEnabled: false,
      attachments: [],
    },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderInRouter(element: ReactNode) {
  const router = createMemoryRouter([{ path: '/', element }], { initialEntries: ['/'] })
  return renderWithQuery(<RouterProvider router={router} />)
}

describe('TotalPatientsTile', () => {
  it('shows the active patient count', async () => {
    renderWithQuery(<TotalPatientsTile />)

    expect(await screen.findByText('42')).toBeInTheDocument()
  })
})

describe('PeakHourTile', () => {
  it('shows the busiest hour and today total', async () => {
    renderWithQuery(<PeakHourTile onOpenBreakdown={vi.fn()} />)

    expect(await screen.findByText('09:00')).toBeInTheDocument()
    expect(await screen.findByText('2 of 2 appointments')).toBeInTheDocument()
  })

  it('shows a dash when nothing is scheduled', async () => {
    getAppointmentsSpy.mockResolvedValue([])

    renderWithQuery(<PeakHourTile onOpenBreakdown={vi.fn()} />)

    expect(await screen.findByText('—')).toBeInTheDocument()
  })
})

describe('ScheduledTodayTile', () => {
  it('counts only today', async () => {
    renderInRouter(<ScheduledTodayTile />)

    expect(await screen.findByText('2')).toBeInTheDocument()
  })
})

describe('tile independence', () => {
  it('shares one appointments request across both tiles', async () => {
    renderInRouter(
      <>
        <PeakHourTile onOpenBreakdown={vi.fn()} />
        <ScheduledTodayTile />
      </>,
    )

    await waitFor(() => expect(getAppointmentsSpy).toHaveBeenCalledTimes(1))
  })
})
```

The last test is the one that proves the design claim: two independent tiles, one request.

- [ ] **Step 11: Verify the cycle is gone**

Run: `grep -rn "from '@/features/" --include=*.ts --include=*.tsx src/features | grep -v "features/auth/.*@/features/auth"`
Expected: no output. This, not `import/no-cycle`, is the real gate — the cycle rule already reported
zero after Task 1 while a one-way cross-feature import was still present.

Run: `npx oxlint --import-plugin -D import/no-cycle src`
Expected: zero `import(no-cycle)` errors.

Run: `npm run test`
Expected: PASS. 168 from before, plus 5 tile tests = 173.

---

### Task 6: Introduce the pages layer

**Files:**

- Move: the four page components and their CSS and test into `frontend/src/pages/`
- Modify: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/features/auth/index.ts`
- Modify: `frontend/src/features/appointments/index.ts`

**Interfaces:**

- Consumes: the widened barrels from Tasks 2, 3 and 5.
- Produces: `PatientsPage`, `AppointmentsPage`, `LoginPage`, `RegisterPage` from `@/pages/...`.

- [ ] **Step 1: Move the files**

```bash
mkdir -p frontend/src/pages
git mv frontend/src/features/patients/pages/PatientsPage.tsx frontend/src/pages/PatientsPage.tsx
git mv frontend/src/features/patients/pages/PatientsPage.module.css frontend/src/pages/PatientsPage.module.css
git mv frontend/src/features/patients/pages/PatientsPage.test.tsx frontend/src/pages/PatientsPage.test.tsx
git mv frontend/src/features/appointments/pages/AppointmentsPage.tsx frontend/src/pages/AppointmentsPage.tsx
git mv frontend/src/features/appointments/pages/AppointmentsPage.module.css frontend/src/pages/AppointmentsPage.module.css
git mv frontend/src/features/auth/pages/LoginPage.tsx frontend/src/pages/LoginPage.tsx
git mv frontend/src/features/auth/pages/RegisterPage.tsx frontend/src/pages/RegisterPage.tsx
```

- [ ] **Step 2: Widen the appointments and auth barrels**

Replace the whole of `features/appointments/index.ts`:

```ts
export { AppointmentDetailPanel } from './components/AppointmentDetailPanel'
export { AppointmentFormPanel } from './components/AppointmentFormPanel'
export { CalendarToolbar } from './components/CalendarToolbar'
export { DayView } from './components/DayView'
export { MonthView } from './components/MonthView'
export { WeekView } from './components/WeekView'
export {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment,
} from './api/appointmentsApi'
export { appointmentKeys } from './api/appointmentKeys'
export { useAppointmentsQuery } from './hooks/useAppointmentsQuery'
export { mockPatients, type MockPatient } from './api/mockPatients'
export { WEEKDAYS } from './lib/dateHelpers'
export type { Appointment, AppointmentInput, CalendarView } from './types'
```

Replace the whole of `features/auth/index.ts`:

```ts
export { AuthProvider, useAuth } from './context/AuthContext'
export { ProtectedRoute } from './routes/ProtectedRoute'
export { AuthLayout } from './components/AuthLayout'
export { PasswordField } from './components/PasswordField'
export { useAuthOutlet } from './context/AuthLayoutContext'
export { validateEmail, validatePassword, validateRequired } from './validation/authValidation'
export { default as authFormStyles } from './components/AuthForm.module.css'
export type { LoginRequest, RegisterRequest } from './types'
```

`LoginPage` and `RegisterPage` are no longer exported here — they are pages now.

- [ ] **Step 3: Repoint the moved pages at the barrels**

In `frontend/src/pages/PatientsPage.tsx`, replace every relative `'../components/...'`,
`'../api/...'`, `'../hooks/...'`, `'../lib/...'` and `'../types'` import with a single barrel
import:

```tsx
import {
  patientKeys,
  PatientDetailPanel,
  PatientFilters,
  PatientFormPanel,
  PatientTable,
  parseFilterParams,
  toFilterParams,
  useAllergenByName,
  usePatientsQuery,
  deletePatient,
  getPatient,
} from '@/features/patients'
import type {
  PatientDetail,
  PatientFiltersType,
  PatientListItem,
  PatientPage,
} from '@/features/patients'
```

The local alias `PatientFilters as PatientFiltersType` in the old type import is no longer needed —
the barrel already exports the type under that name. The CSS import becomes
`import styles from './PatientsPage.module.css'`.

In `frontend/src/pages/AppointmentsPage.tsx`, replace the relative imports with:

```tsx
import {
  AppointmentDetailPanel,
  AppointmentFormPanel,
  CalendarToolbar,
  DayView,
  MonthView,
  WeekView,
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment,
  mockPatients,
  type MockPatient,
} from '@/features/appointments'
import type { Appointment, AppointmentInput, CalendarView } from '@/features/appointments'
```

In `frontend/src/pages/LoginPage.tsx` and `frontend/src/pages/RegisterPage.tsx`, replace the five
or six `@/features/auth/...` deep imports with:

```tsx
import {
  authFormStyles as styles,
  PasswordField,
  useAuth,
  useAuthOutlet,
  validateEmail,
  validatePassword,
} from '@/features/auth'
```

`RegisterPage` additionally imports `validateRequired` from the same barrel.

- [ ] **Step 4: Update the router**

Replace the imports at the top of `frontend/src/app/routes.tsx`:

```tsx
import { createBrowserRouter, Navigate } from 'react-router'
import { AuthLayout, ProtectedRoute } from '@/features/auth'
import { AppLayout } from '@/app/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { PatientsPage } from '@/pages/PatientsPage'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
```

The route tree below is unchanged.

- [ ] **Step 5: Fix the moved test's import paths**

In `frontend/src/pages/PatientsPage.test.tsx`, leave `'./PatientsPage'` alone — both files moved
together, so it still resolves. Change the API stub imports from `'../api/patientsApi'` and
`'../api/allergensApi'` to `'@/features/patients/api/patientsApi'` and
`'@/features/patients/api/allergensApi'`. The `'../types'` import becomes `'@/features/patients'`.
No assertion changes.

- [ ] **Step 6: Verify**

Run: `npx tsc -b`
Expected: no output. This is the first point since Task 3 where the typecheck passes.

Run: `npm run test`
Expected: 173 passed.

Run: `npm run build`
Expected: succeeds.

---

### Task 7: Move the query client and enable the cycle rule

**Files:**

- Move: `frontend/src/shared/lib/queryClient.ts` and `queryClient.test.ts` into `frontend/src/app/`
- Modify: `frontend/src/app/App.tsx`
- Modify: `frontend/.oxlintrc.json`

**Interfaces:**

- Produces: `queryClient` and `shouldRetry` from `@/app/queryClient`.

- [ ] **Step 1: Move the client**

```bash
git mv frontend/src/shared/lib/queryClient.ts frontend/src/app/queryClient.ts
git mv frontend/src/shared/lib/queryClient.test.ts frontend/src/app/queryClient.test.ts
```

In `frontend/src/app/queryClient.ts` the `ApiError` import stays as
`import { ApiError } from '@/shared/lib/apiClient'` — that is a downward import and remains legal.

In `frontend/src/app/queryClient.test.ts`, change `from './apiClient'` to
`from '@/shared/lib/apiClient'`.

In `frontend/src/app/App.tsx`, change
`import { queryClient } from '@/shared/lib/queryClient'` to
`import { queryClient } from '@/app/queryClient'`.

- [ ] **Step 2: Turn on the cycle rule**

Replace `frontend/.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc", "import"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }],
    "import/no-cycle": "error"
  }
}
```

- [ ] **Step 3: Full verification**

Run: `npm run lint`
Expected: zero errors. The only output is the two pre-existing
`react(only-export-components)` warnings, in `AuthContext.tsx` and `renderWithQuery.tsx`. If
`import/no-cycle` reports anything, a cycle survived and must be traced before continuing.

Run: `npx tsc -b`
Expected: no output.

Run: `npm run test`
Expected: 173 passed.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Confirm the structure**

Check that `src/` now contains exactly `app`, `features`, `pages`, `shared`, `test`, `widgets`,
`index.css` and `main.tsx`.

Check that no file under `src/features` imports from another feature: search `src/features` for
`@/features/` and confirm the only hits are auth's self-imports, which are a documented follow-up
and not a cross-feature dependency.

- [ ] **Step 5: Format the new files**

Run Prettier over only the files created by this plan. Do not run `npm run format`; the repo has
pre-existing drift in 113 unrelated files.

---

## Notes for the executor

- Do not commit. The repo owner commits their own work.
- Do not add code comments.
- Tasks 3 through 5 leave `npx tsc -b` failing because the barrel drops `PatientsPage` before Task 6
  moves it. That is expected and called out in each task. `npm run test` stays green throughout.
- If a test's call count differs because two components now share a query key, that is
  deduplication working. Adjust the expectation; do not give the components different keys.
