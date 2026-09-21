# VorgaVet Frontend — Appointments: Vet Calendar on Real Data (Sub-project 1)

## Context

The backend now ships a full appointments domain (commits `3803924`, `6564fd5`, `fbacc1f`):
roles, clinic schedule, the appointment aggregate with a status lifecycle, availability,
examinations and attachments. The frontend Appointments page
(`docs/specs/2026-08-04-zakazano.md`) still runs on an in-memory mock whose
model disagrees with the backend on almost every field: `date`/`time` strings instead of UTC
instants, a mandatory `patientId`, invented types, no status, free-form update/delete, and
attachments on the appointment instead of the examination.

The work is split into five sub-projects, each with its own spec, plan and implementation:

1. **Vet calendar on real data** — this spec.
2. Scheduling actions (vet): create with availability, reschedule, cancel, no-show, unresolved list.
3. Visit flow (vet): check-in with owner/patient resolution, complete with the examination form,
   walk-ins, pay.
4. Examinations and attachments, plus a visit history section in the patient detail panel.
5. Client appointments page: availability, booking, own appointments.

Guiding rule: follow the backend contract. Where the backend defines something (opening hours,
slot size, statuses, visibility), the frontend reads it rather than hard-coding its own version.

## Goals

- Replace the mock appointment layer with the real endpoints `GET appointments?from&to` and
  `GET appointments/availability?from&to`.
- Keep the Day / Week / Month calendar. Each view requests exactly its visible range.
- Day view rows come from availability slots (30 minutes, clinic opening hours from the backend).
- Show every status with distinct styling; hide `no_show` and `cancelled` behind a
  "Show cancelled" toggle that is off by default.
- A read-only appointment detail panel that shows the patient summary when a patient exists and
  explains a booking without one.
- Move the dashboard tiles onto real data.
- Hide appointments from clients until sub-project 5.
- All clinic time handling is explicit (`Europe/Belgrade`) and independent of the browser timezone.

## Non-goals

- Any write action: create, reschedule, cancel, no-show, check-in, complete (sub-projects 2 and 3).
  The page is read-only in this sub-project; the "New appointment" button is removed.
- Examinations, attachments, visit history (sub-project 4).
- Any client-facing appointments UI (sub-project 5).
- Print, reminders and species emoji on chips. The backend provides none of these.
- Backend changes.

## Backend contract used

| Endpoint | Access | Notes |
|---|---|---|
| `GET appointments?from&to` | any authenticated; clients scoped to their own | Overlap with `[from, to)`, ordered by `startsAt`, not paged. `to > from`, range ≤ 62 days, otherwise `Appointments.InvalidRange` / `Appointments.RangeTooWide`. |
| `GET appointments/availability?from&to&durationMinutes?` | any authenticated | 30-minute slots generated from `ClinicSchedule` in the clinic timezone. A closed day yields no slots. Same range limits. |
| `GET patients/{id}` | any authenticated; clients scoped | Existing endpoint, used for the patient summary. |

`AppointmentResponse`: `id`, `createdByUserId`, `ownerId?`, `patientId?`, `startsAt`, `endsAt`,
`durationMinutes`, `type` (int), `status` (int), `reason?`, `ownerName?`, `patientName?`,
`createdAt`. All instants are UTC.

`AvailabilitySlotResponse`: `startsAt`, `endsAt`, `isAvailable`, `isMine`.

Backend enums:
- `AppointmentType`: `FirstVisit = 0`, `Checkup = 1`, `BloodDraw = 2`, `Surgery = 3`
- `AppointmentStatus`: `Scheduled = 0`, `CheckedIn = 1`, `Completed = 2`, `NoShow = 3`,
  `Cancelled = 4`

## Stack additions

| Package | Purpose |
|---|---|
| `@date-fns/tz` | `TZDate` and `tz()` for date-fns v4, used only inside `shared/lib/clinicTime.ts` to compute clinic-local day boundaries and format UTC instants in the clinic timezone, including DST transitions. |

## Architecture

Layering stays as defined in `2026-08-29-frontend-layered-structure.md`:
`app -> pages -> widgets -> features -> shared`, and features never import each other. The page
composes the appointments and patients features.


## Clinic time — `shared/lib/clinicTime.ts`

The single module that knows the clinic timezone. Nothing else calls `new Date()` for calendar
purposes or uses date-fns local-time functions on appointment instants.

- `CLINIC_TIME_ZONE = 'Europe/Belgrade'`. It must match the backend's `Clinic:TimeZone`, which
  the backend does not expose.
- The calendar identifies days by **clinic date strings** `YYYY-MM-DD`. The page's `currentDate`
  is such a string, never a browser `Date`.

| Function | Result |
|---|---|
| `clinicToday()` | today's clinic date, e.g. `'2026-09-17'` |
| `clinicDayRange(dateIso)` | `{ from, to }` UTC ISO strings: clinic midnight of `dateIso` to clinic midnight of the next day |
| `clinicWeekRange(dateIso)` | Monday 00:00 to next Monday 00:00 (clinic time) of the week containing `dateIso` |
| `clinicMonthGridRange(dateIso)` | the full 6-week (42-day) grid shown by `MonthView`, Monday-first |
| `clinicRecentDaysRange(days, endDateIso)` | `days` whole clinic days ending with `endDateIso` inclusive |
| `clinicDateOf(utcIso)` | clinic date `YYYY-MM-DD` of an instant |
| `clinicTimeOf(utcIso)` | clinic time `HH:mm` of an instant |
| `addClinicDays(dateIso, n)` / `addClinicWeeks` / `addClinicMonths` | pure date-string arithmetic for toolbar navigation |

Ranges are half-open and a DST transition day is 23 or 25 hours long; the helpers compute
boundaries from clinic midnights, never by adding 24 hours.

## Data layer

### Types — `features/appointments/types.ts`


### Mapping — `lib/appointmentMapping.ts`

Maps the DTO (numeric enums, optional fields) to `Appointment`, mirroring
`features/patients/lib/patientMapping.ts`. A `null` in the response becomes `undefined`, matching
the patients feature's `optional()` convention. An unknown
numeric `type` or `status` throws, so the query fails visibly instead of rendering a wrong status.

### Visibility — `lib/appointmentVisibility.ts`

- `countsTowardLoad(appointment)`: `false` for `no_show` and `cancelled`, `true` otherwise. Used by
  the dashboard statistics.
- `isVisible(appointment, showCancelled)`: `showCancelled || countsTowardLoad(appointment)`. Used
  by the calendar.

### API, keys, hooks

- `getAppointments(range: DateRange): Promise<Appointment[]>` →
  `GET /appointments?from=<from>&to=<to>`, mapped.
- `getAvailability(range: DateRange): Promise<AvailabilitySlot[]>` →
  `GET /appointments/availability?from=<from>&to=<to>`.
- `appointmentKeys.all = ['appointments']`, `list(from, to)`, `availability(from, to)`.
- `useAppointmentsQuery(range, enabled = true)` and `useAvailabilityQuery(range, enabled = true)`.

The range is part of the key, so each visible day, week or month is cached independently, and
the dashboard's "today" query shares its cache entry with the calendar's day view for today.

## Appointments page

`AppointmentsPage` state:
- `view: CalendarView`, initialised from `?view=`, default `week`.
- `currentDate: string` (clinic date), initialised from `?date=`, default `clinicToday()`.
- `showCancelled: boolean`, default `false`.
- `selected: Appointment | null` for the detail panel (open/close animation state kept as today).

It derives one `DateRange` from `view` and `currentDate` (`clinicDayRange`, `clinicWeekRange`,
`clinicMonthGridRange`) and runs `useAppointmentsQuery(range)` and `useAvailabilityQuery(range)`.
Appointments are filtered with `isVisible(…, showCancelled)` before reaching the views.

Header: "Appointments" title and subtitle, no action button.

Loading renders the views' skeletons. A failure of either query shows the toast
"Could not load appointments" once, and the calendar body is replaced by `EmptyState`
"Appointments could not be loaded." Closed-day indicators ("Closed", the closed-day empty state)
are derived only from a successfully loaded availability response, never from a missing or
failed one.

### `CalendarToolbar`

Unchanged controls (Day/Week/Month, ‹ Today ›, date picker, disabled Print), working on clinic date
strings, plus a "Show cancelled" checkbox bound to `showCancelled`.

### `DayView`

Props: `date`, `appointments`, `slots`, `onAppointmentClick`, `isLoading`.

- Rows are the day's availability slots in order, labelled `clinicTimeOf(slot.startsAt)`.
- No slots: `EmptyState` "The clinic is closed on this day." Appointments on a closed day still
  render in the outside-hours group below.
- Each row lists the appointments whose `startsAt` falls in `[slot.startsAt, slot.endsAt)`,
  stacked in `startsAt` order.
- An appointment longer than one slot shows its time range (`09:00–10:30`) on its chip. Every
  later slot it overlaps (`startsAt < slot.endsAt && endsAt > slot.startsAt`) shows a muted
  "↳ continues" marker.
- A slot with `isAvailable: true` and no appointment starting in it shows a faint "Free" label.
- Appointments that start in no slot (outside opening hours, or on a closed day) render in an
  "Outside opening hours" group above the rows.

### `WeekView` and `MonthView`

Layout unchanged from the current implementation (7 cells; 6-week grid), on real data:
- Appointments grouped by `clinicDateOf(startsAt)`, sorted by `startsAt`, up to 3 chips per cell
  and a "+N more" button that opens that day in `DayView`.
- A day with no availability slots shows a "Closed" label and still lists its appointments.
- Today is highlighted by `clinicToday()`.

### `AppointmentChip`

- Text: `HH:mm` (or `HH:mm–HH:mm` when longer than 30 minutes), then `patientName · ownerName`.
  Without a patient: "No patient yet", followed by `ownerName` or "Client booking".
- Status styling: `scheduled` default, `checked_in` highlighted, `completed` muted, `no_show` and
  `cancelled` struck through.
- `title` tooltip: type label, status label and reason.

## Appointment detail panel

`AppointmentDetailPanel` (features/appointments), props: `appointment`, `open`, `onOpenChange`,
`patientSection: ReactNode`, `onOpenPatientRecord?: () => void`.

- Header: "patientName · ownerName", or "Client booking" when both are missing. Subtitle: weekday,
  `dd.MM.yyyy` and time range in clinic time.
- "Appointment" section: Date, Time, Duration, Type, Status (`Badge`, tone by status), Reason,
  Created.
- "Patient" section: renders `patientSection`.
- Footer: "Patient record" button when `onOpenPatientRecord` is provided. No other actions.

The page supplies:
- `patientSection`: `<PatientSummary patientId=… />` when `patientId` exists; otherwise a note
  "Patient not yet assigned — resolved at check-in." plus the owner name, or
  "Owner not yet assigned" when `ownerName` is also missing.
- `onOpenPatientRecord`: navigates to `/patients?patient=<patientId>` (already handled by
  `PatientsPage`), only when `patientId` exists.

### `PatientSummary` (features/patients)

Read-only: Record no., Name, Breed, Age, Allergies (badges), Owner, Phone. Data from the new
`usePatientQuery(patientId)`, which uses `patientKeys.detail(id)` and `getPatient`, sharing the
cache with `PatientsPage`. Loading shows `Skeleton`; an error shows the inline text
"Could not load the patient record." without a toast.

## Dashboard tiles

`widgets/dashboard` moves onto ranged queries:

- `useTodayAppointmentCount` and `usePeakHourToday`:
  `useAppointmentsQuery(clinicDayRange(clinicToday()))`, filtered by `countsTowardLoad`.
- `usePeakHoursBreakdown(enabled)`:
  `useAppointmentsQuery(clinicRecentDaysRange(28, clinicToday()), enabled)`, filtered by
  `countsTowardLoad`. Each weekday appears exactly four times; `averagePerDay = total / 28`.
- `appointmentStats.ts` groups by `clinicTimeOf(startsAt)` hour and by the weekday of
  `clinicDateOf(startsAt)`. Appointments count once, at their start hour. The histogram covers
  07:00–19:00 plus any other hour that has appointments, so totals always match the data.
- `ScheduledTodayTile` links to `/appointments?view=day&date=<clinicToday()>`.

## Role guard

- `RoleRoute` (`features/auth/routes/RoleRoute.tsx`): `<RoleRoute allow="veterinarian" />` renders
  `<Outlet />` for that role and `<Navigate to="/patients" replace />` otherwise.
- `routes.tsx`: `/appointments` sits inside `RoleRoute allow="veterinarian"`.
- `AppLayout`: the "Appointments" nav link renders only for a veterinarian.
- `PatientsPage`: `PeakHourTile`, `ScheduledTodayTile` and `PeakHoursPanel` render only for a
  veterinarian; `TotalPatientsTile` stays for everyone.

A client therefore never mounts a component that requests appointments.

## Error handling

| Case | Behaviour |
|---|---|
| Appointments or availability query fails | Toast "Could not load appointments"; calendar body shows "Appointments could not be loaded." and never a closed-day state. Retries follow `shouldRetry` (none for 4xx). |
| `InvalidRange` / `RangeTooWide` | Not reachable: ranges come from `clinicTime` and are at most 42 days. Falls into the toast above if it ever occurs. |
| Unknown enum value in a response | Mapping throws; handled as a failed query. |
| Patient summary fails | Inline message inside the panel; the rest of the panel stays usable. |
| Client opens `/appointments` | Redirected to `/patients` before any request. |

## Testing

Vitest and Testing Library, following the existing patients page tests.

- **Timezone guard:** the test configuration runs with `TZ=America/New_York`, so any code that
  relies on the browser timezone instead of `clinicTime` fails. Verify during implementation that
  the setting takes effect on Windows; if it does not, set it through the `test` script instead.
- `clinicTime.test.ts`: day range in summer (UTC+2) and winter (UTC+1); the DST day 2026-03-29
  (23 hours) and 2026-10-25 (25 hours); week starts Monday; month grid is 42 days; 28-day recent
  range; `clinicDateOf('2026-09-16T23:30:00Z') === '2026-09-17'`; `clinicTimeOf` formatting.
- `appointmentMapping.test.ts`: every enum value; nulls; unknown value throws.
- `appointmentVisibility.test.ts`.
- `appointmentsApi.test.ts`: `from`/`to` query parameters and mapping.
- `DayView.test.tsx`: rows from slots, closed day, multi-slot "continues", "Free", outside-hours
  group.
- `WeekView.test.tsx` / `MonthView.test.tsx`: grouping by clinic date across UTC midnight,
  "Closed", "+N more".
- `AppointmentDetailPanel.test.tsx`: fields, status badge, patient slot, record button presence.
- `PatientSummary.test.tsx`: data, loading, error.
- `AppointmentsPage.test.tsx`: requested range per view, "Show cancelled" toggle, error toast and
  no closed-day state when availability fails, panel without patient shows the note.
- `RoleRoute.test.tsx`, `AppLayout` nav per role, `PatientsPage` hides appointment tiles for a client.
- `appointmentStats.test.ts`, `DashboardTiles.test.tsx`, `useAppointmentsQuery.test.ts` rewritten
  for ranged real data and the 28-day window.

`tsc -b`, `npm run build`, `npm run lint` and the full test suite stay clean.

## Where it lives

```
src/shared/lib/clinicTime.ts            the only module that knows the clinic timezone
src/features/appointments/
  types.ts, api/, hooks/                appointments and availability on the real endpoints
  lib/appointmentMapping.ts             numeric enums to domain values
  lib/appointmentVisibility.ts          cancelled and no-show rules
  lib/appointmentLabels.ts              type, status and party labels
  lib/daySlots.ts                       availability plus appointments to day rows
  lib/calendarDays.ts                   grouping by clinic date, open days
  lib/appointmentViewParams.ts          the view, date and cancelled toggle in the URL
  components/AppointmentChip.tsx        one appointment as a button
  components/DayView.tsx                slot rows
  components/WeekView.tsx               a cell per day with a chip limit
  components/MonthView.tsx              the six-week grid
  components/CalendarToolbar.tsx        view switch, navigation, date picker, toggle
  components/AppointmentDetailPanel.tsx read-only panel, patient section as a slot
src/features/patients/
  hooks/usePatientQuery.ts              one patient by id
  components/PatientSummary.tsx         the summary the detail panel shows
src/features/auth/routes/RoleRoute.tsx  keeps clients off the page
src/widgets/dashboard/                  tiles moved onto real appointment data
src/pages/AppointmentsPage.tsx          composes the calendar with the patient summary
```

Removed in this step: the mock appointment and patient data, the latency simulator, the old
appointment form panel and every pre-existing calendar component.

## Build order

Tests came before the code they cover, and each step ended with the suite, the typecheck and the
linter green.

- [x] **Clinic time.** `clinicTime.ts` and its ranges, with tests over both daylight-saving days.
- [x] **Data layer, and the mock removed.** Types, mapping, visibility, API, keys and hooks on the
  real endpoints; the dashboard tiles moved onto the same data; the mock layer, the latency
  simulator and every old calendar component deleted, the page reduced to a shell.
- [x] **Chip and labels.** The label module and `AppointmentChip`.
- [x] **Day view.** `daySlots.ts` and `DayView`.
- [x] **Week and month views.** `calendarDays.ts`, `WeekView`, `MonthView`.
- [x] **Toolbar and page.** View, date and toggle in the URL, driven by `CalendarToolbar`.
- [x] **Patient summary.** `usePatientQuery` and `PatientSummary` in the patients feature.
- [x] **Detail panel.** Read-only panel taking the patient section as a slot.
- [x] **Role guard.** `RoleRoute`, the nav link and the vet-only dashboard tiles.
