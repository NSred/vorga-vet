# VorgaVet Frontend — Zakazano Tab (Phase 2)

## Context

Phase 1 (`docs/superpowers/specs/2026-08-04-kartoteka-shared-ui-design.md`) built
the `shared/ui` component library and the Kartoteka (patient records) tab against
a mock data layer, explicitly deferring Zakazano (appointment scheduling) to its
own spec. This is that spec.

The reference mockup (`frontend/src/design/VorgaVet - Kartoteka (standalone).html`)
models appointments as *optionally* linked to a Kartoteka patient record. The user
has clarified that in this app, **every appointment is connected to exactly one
animal** — a deliberate simplification that removes the mockup's "unlinked
appointment" branch entirely (see Data model below).

Still no backend for any of this — same as Phase 1, everything is a mock data
layer shaped so real HTTP calls can be dropped in later without UI changes.

## Goals

- A `features/zakazano/` tab: Day/Week/Month calendar views, and right-side
  panels for viewing, editing, and creating an appointment — built on the
  `shared/ui` library from Phase 1, no new shared components needed.
- Every appointment mandatorily linked to a patient; the appointment panel always
  shows real patient data (never an "unlinked" empty state).
- Rewire Kartoteka's two placeholder stat cards ("Najtraženiji sat", "Danas
  zakazano") to compute from real appointment data, closing out the follow-up
  flagged in the Phase 1 spec.
- Cross-navigation between the two tabs (Kartoteka stat card → Zakazano Day view;
  appointment panel → that patient's Kartoteka record).
- RTG/findings file attachments on the appointment panel (mock-only: in-memory
  metadata + object-URL previews, nothing persists past a reload).

## Non-goals (explicitly out of scope for this pass)

- **Dijagnoze, Izveštaji tabs** — still deferred, unchanged from Phase 1.
- **Any backend work** — purely frontend, mock data only.
- **Tests** — no test infra added, consistent with Phase 1.
- **"Očisti prošle" (bulk-clear past appointments)** — individual `Obriši` per
  appointment covers deletion; the bulk action is deferred.
- **Real print styling** for `Štampaj` — disabled stub, same as Kartoteka.
- **A styled confirmation dialog** for delete — `window.confirm()`, same as
  Kartoteka.
- **Editable/custom reminder timing** — reminder is always "day before" when the
  checkbox is on; no separate reminder-date field.

## Stack additions

| Package | Purpose |
|---|---|
| `date-fns` | Pure date-math functions for the calendar views (`addDays`, `addWeeks`, `addMonths`, `startOfWeek`, `startOfMonth`, `eachDayOfInterval`, `isSameDay`, `isToday`, `format`). Tree-shakeable, no UI/theming of its own — the calendar grids themselves stay hand-rolled CSS Modules like everything else. |

No new `shared/ui` components — Zakazano reuses `SlidePanel`, `Select`,
`TextField`, `Textarea`, `Button`, `Badge`, `Spinner`, `Skeleton`, `EmptyState`
as-is.

## Folder structure

```
frontend/src/features/zakazano/           # NEW
├── api/
│   ├── mockData.ts            # ~12 seeded appointments across the Phase 1 patients
│   └── appointmentsApi.ts     # mock CRUD + addAttachment/removeAttachment
├── types.ts                    # Appointment, AppointmentInput, AppointmentAttachment
├── components/
│   ├── CalendarToolbar.tsx     # Dan/Nedelja/Mesec, ‹›, Danas, date input, Štampaj stub
│   ├── AppointmentChip.tsx     # shared chip used by all 3 views
│   ├── DayView.tsx
│   ├── WeekView.tsx
│   ├── MonthView.tsx
│   ├── AppointmentDetailPanel.tsx
│   └── AppointmentFormPanel.tsx   # shared create + edit
├── pages/
│   └── ZakazanoPage.tsx
└── index.ts                     # exports ZakazanoPage, getAppointments, Appointment
                                  #   (the last two consumed by kartoteka/api/statsApi.ts)
```

Modified from Phase 1:
```
frontend/src/
├── app/
│   ├── routes.tsx                # + "/zakazano" route
│   └── layout/AppLayout.tsx      # + "Zakazano" nav link
└── features/kartoteka/
    ├── api/statsApi.ts           # peakHour/todayAppointmentsCount now derived
    │                              #   from zakazano's getAppointments(), the
    │                              #   standalone HOURLY_APPOINTMENT_COUNTS
    │                              #   placeholder is deleted
    ├── components/StatCards.tsx  # "Danas zakazano" card becomes a Link
    └── pages/KartotekaPage.tsx   # reads ?patient=<id> on mount, auto-opens
                                   #   that patient's PatientDetailPanel
```

## Data model

```ts
type AppointmentType = 'prvi_pregled' | 'kontrola' | 'vakcinacija' | 'ostalo'

interface AppointmentAttachment {
  id: string
  fileName: string
  fileType: string
  fileSizeBytes: number
  previewUrl?: string        // object URL, image files only
}

interface Appointment {
  id: string
  patientId: string           // required — always resolves to a real Patient
  date: string                  // ISO date, e.g. "2026-08-05"
  time: string                    // "HH:MM"
  type: AppointmentType
  note?: string
  reminderEnabled: boolean
  attachments: AppointmentAttachment[]
}

type AppointmentInput = Omit<Appointment, 'id' | 'attachments'>
```

`Status` (Završen / Danas / Predstoji) and `Dan` (weekday name) are both derived
from `date` at render time — never stored, same principle as Kartoteka's `Saldo`.

## Mock data layer

`features/zakazano/api/appointmentsApi.ts`:

```ts
getAppointments(): Promise<Appointment[]>          // full seeded array; calendar
                                                      //   views filter client-side
                                                      //   by visible date range
getAppointment(id: string): Promise<Appointment>
createAppointment(input: AppointmentInput): Promise<Appointment>
updateAppointment(id: string, input: AppointmentInput): Promise<Appointment>
deleteAppointment(id: string): Promise<void>
addAttachment(appointmentId: string, file: File): Promise<Appointment>
removeAttachment(appointmentId: string, attachmentId: string): Promise<Appointment>
```

Same shape/conventions as Phase 1's `patientsApi`: in-memory array in
`mockData.ts`, every function awaits `simulateLatency`, not-found throws.
`addAttachment` reads the `File`'s name/type/size, and for image types builds a
preview via `URL.createObjectURL`.

Seed data: ~12 appointments referencing the 8 patients seeded in
`kartoteka/api/mockData.ts`, spread across a few days before/after "today" (mix
of past/today/future, and a mix of `reminderEnabled` true/false) so all three
calendar views and both rewired stat cards have real data to render against.

## Zakazano tab

**Page layout** (`ZakazanoPage`, new `/zakazano` route):
1. Header — "Zakazane posete" title, subtitle, "＋ Novi termin" button
2. `CalendarToolbar` — `Dan/Nedelja/Mesec` segmented toggle (default: Nedelja),
   `‹`/`›`, `Danas`, native date input, `🖨 Štampaj` (disabled)
3. Calendar body — `DayView`/`WeekView`/`MonthView` per the toggle

Reads `view`/`date` query params on mount (set by the Kartoteka cross-nav link);
defaults to Week/today when absent.

**Patient join**: on mount, fetches both `getAppointments()` and
`getPatients({ status: 'svi' })`, builds a `Map<string, Patient>`, passes it to
the calendar views and panels for synchronous name/owner lookups — avoids
per-chip async patient fetches.

**Calendar views**, all using the shared `AppointmentChip` (time + species emoji
+ patient name · owner; light-green fill normally, amber fill + 🔔 suffix when
`reminderEnabled`; click opens the detail panel):
- **Dan**: hourly rows 07:00–20:00; multiple appointments in the same hour stack
  vertically as full-width bars
- **Nedelja**: 7-column Pon–Ned grid; date + appointment-count badge per cell;
  stacked chips with a "+N još" overflow link; today's column tinted
- **Mesec**: month grid; up to 3 chips per day cell, "+N još" overflow beyond that

**Detail panel** (`AppointmentDetailPanel`) — amber header band (📅 icon,
"Name · Owner", weekday/date/time subtitle):
- **Podaci o terminu** (2-col grid): `Datum` · `Vreme` · `Tip termina` ·
  `Status` (derived) · `Dan` (derived) · `Podsetnik vlasniku` ("isključen" or
  "🔔 dan pre · <date-1>") · `Intervencija / napomena` (full width)
- **Nalazi i RTG snimci (N)**: attachment list (filename, size, thumbnail for
  images) each with a remove button; empty state "Nema priloženih nalaza za
  ovaj termin."; file input + "Dodaj RTG / nalaz" button (accepts PDF/image),
  calls `addAttachment` directly from this view — not part of the edit form
- **Pacijent iz kartoteke**: always populated — `Broj kartona` · `Ime` · `Rasa`
  · `Starost` · `Alergije` · `Telefon` · `Vlasnik`
- Footer: `Obriši` (red) · `✎ Izmeni` (outline) · `Karton` (outline, navigates
  to `/?patient=<patientId>`)

**Form panel** (`AppointmentFormPanel`, shared create/edit, mirrors
`PatientFormPanel`'s pattern): `Datum *` (date) · `Vreme` (time) · `Tip termina`
(select: Prvi pregled/Kontrola/Vakcinacija/Ostalo) · `Pacijent (vlasnik) *`
(select, full roster formatted "🐶 Name · Owner", required) ·
`Intervencija / napomena` (textarea) · checkbox `Automatski podseti vlasnika
dan pre` (→ `reminderEnabled`). Footer `Odustani`/`Sačuvaj termin` on create,
`Obriši`/`Sačuvaj izmene` on edit.

## Cross-feature wiring

- **`kartoteka/api/statsApi.ts`**: deletes the standalone
  `HOURLY_APPOINTMENT_COUNTS` placeholder; imports `getAppointments` from
  `@/features/zakazano` and computes `peakHour`/`todayAppointmentsCount` from
  real appointment `date`/`time` values.
- **`kartoteka/components/StatCards.tsx`**: "Danas zakazano" card becomes a
  `react-router` `Link` to `/zakazano?view=dan&date=<today's ISO date>`.
- **`kartoteka/pages/KartotekaPage.tsx`**: reads `?patient=<id>` via
  `useSearchParams` on mount; if present and the patient exists, opens
  `PatientDetailPanel` for it directly (same panel-state mechanism already
  used for row clicks).
- **`app/routes.tsx`** / **`app/layout/AppLayout.tsx`**: add the `/zakazano`
  route and its nav link, both inside the existing `ProtectedRoute` +
  `AppLayout` wrapping.

## Risks / follow-ups

- **Attachment persistence**: `addAttachment`/`removeAttachment` only mutate
  the in-memory mock array and `URL.createObjectURL` blobs — both are gone on
  page reload. Acceptable for this mock-data phase; flagged for whoever wires
  up the real backend (actual file storage is a backend concern, not addressed
  here).
- **Cross-feature import direction**: `kartoteka` importing from `zakazano` (for
  stats) is a one-way dependency — `zakazano` never imports from `kartoteka`
  except for its own patient-roster lookups via `patientsApi`, which already
  existed as a public Phase 1 API. Keep it one-directional if a third feature
  ever needs both, to avoid a cycle.
- **Calendar performance**: with only ~12 seeded appointments this is a
  non-issue; if the mock dataset grows significantly, `getAppointments()`
  returning the full array with client-side range filtering may need to become
  a real range-scoped query — not a concern at this scale.
