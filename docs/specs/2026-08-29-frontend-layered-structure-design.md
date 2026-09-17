# Layered feature-driven structure for the frontend — design

Date: 2026-08-29
Status: designed, not implemented.

## Goal

Make the frontend's layering explicit and acyclic: introduce `pages/` and `widgets/` layers, remove
the circular dependency between the patients and appointments features, and rebuild the dashboard so
its figures derive from the features' query caches instead of a separate aggregating API.

## Why

The `app/` / `features/` / `shared/` layout is already feature-driven, but two defects undermine it.

**The features import each other, in a loop.** `features/patients/api/statsApi.ts` imports
`getAppointments` and `WEEKDAYS` from appointments; appointments imports `Species` and
`SPECIES_EMOJI` back from patients. Enabling oxlint's import plugin reports 11 `import/no-cycle`
errors across both barrels, `statsApi.ts`, `PatientsPage.tsx` and `AppointmentsPage.tsx`.

The cause is that `statsApi` computes dashboard figures from patients *and* appointments, yet lives
inside patients because the patients screen renders the stat cards. It is a third concern wearing a
patients costume.

**Query keys cross boundaries invisibly.** `PatientsPage` invalidates the stats cache with
`queryKey: ['stats']` — a bare string reaching into another module's cache namespace. No compiler
and no lint rule can see it, so renaming the key would silently stop the invalidation.

## Scope

In scope: introducing the `pages/` and `widgets/` layers; rebuilding stats as a `dashboard` widget
whose tiles read the features' query hooks; moving the species vocabulary into `shared`; relocating
`queryClient.ts` to `app/`; widening the feature barrels to cover what the pages need; exporting
`patientKeys`; adding a read query hook and key factory to appointments; enabling `import/no-cycle`.

Out of scope: migrating `AppointmentsPage` onto Query — it keeps its `useEffect` and only gains a
sibling hook. Replacing any mock with a real endpoint; only the patients endpoints exist, and
appointments stays mock-backed behind a swappable hook. Backend changes. Repo-wide Prettier drift.

This is not a purely mechanical move. The dashboard's data flow changes, so it needs new tests.

## Decisions

| Decision                     | Choice                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| Cross-feature imports        | Forbidden; features may import only `shared`                |
| Where cross-feature UI lives | A new `widgets/` layer above `features`                     |
| Where route components live  | A new `pages/` layer above `widgets`                        |
| Dashboard data               | Derived from feature query hooks, not a separate stats API  |
| Dashboard composition        | Slot-based: a layout-only grid plus independent tiles       |
| Data with no endpoint yet    | Keep mocks behind hooks; `mock*` filenames mark the seams   |
| `Species` / `SPECIES_EMOJI`  | Down into `shared/domain/species.ts`                        |
| `queryClient.ts`             | `shared/lib/` to `app/`                                     |
| Enforcement                  | oxlint `import/no-cycle` only                               |

## The layer model

```
app/        App.tsx, routes.tsx, layout/, queryClient.ts
pages/      PatientsPage, AppointmentsPage, LoginPage, RegisterPage
widgets/    dashboard/
features/   patients/, appointments/, auth/
shared/     ui/, lib/, config/, domain/
```

A layer imports only from layers strictly below it: `app -> pages -> widgets -> features -> shared`.
No sideways imports at any level.

`pages/` is not optional once `widgets/` exists. `PatientsPage` consumes the dashboard tiles; if
those move up into `widgets/` while the page stays in `features/patients/pages/`, the page imports
upward — the exact violation the layer exists to prevent. All four pages move, so that the layer is
coherent rather than half-applied.

Adding a third or fourth data source to a widget does not endanger this. Every edge still points
down, so the graph stays acyclic no matter how many features a widget reads.

## Breaking the cycle

Both edges are removed, so the features end up independent in each direction.

**`patients -> appointments`** goes away because `statsApi` is deleted; the dashboard widget above
both features does the combining instead.

**`appointments -> patients`** goes away because the shared vocabulary moves down into
`shared/domain/species.ts`, holding the `Species` union and `SPECIES_EMOJI`.

To keep the change small, `features/patients/types.ts` re-exports the type
(`export type { Species } from '@/shared/domain/species'`). The roughly twenty files inside patients
that import `Species` from `'../types'` are then untouched. Appointments imports both symbols from
`@/shared/domain/species` instead of from `@/features/patients`.

## The dashboard widget

Each tile is independent and fetches its own data. The grid holds layout and nothing else.

```
widgets/dashboard/
  components/StatGrid.tsx              layout only, no data, no feature imports
  components/StatCard.tsx              presentational shell: icon, label, value, skeleton
  components/TotalPatientsTile.tsx     reads useActivePatientCount
  components/PeakHourTile.tsx          reads usePeakHourToday, useTodayAppointmentCount
  components/ScheduledTodayTile.tsx    reads useTodayAppointmentCount
  components/PeakHoursPanel.tsx        reads usePeakHoursBreakdown
  hooks/usePeakHourToday.ts            derives from useAppointmentsQuery
  hooks/useTodayAppointmentCount.ts    derives from useAppointmentsQuery
  hooks/usePeakHoursBreakdown.ts       derives from useAppointmentsQuery
  lib/appointmentStats.ts              pure derivation, no I/O
  index.ts
```

Each tile reads exactly one hook per figure it renders, and derives nothing itself. That is what
makes the data source swappable: see "Swapping mocks for real endpoints" below.

The page composes tiles as children rather than threading a stats object down:

```tsx
<StatGrid>
  <TotalPatientsTile />
  <PeakHourTile onOpenBreakdown={() => setPeakHoursOpen(true)} />
  <ScheduledTodayTile />
</StatGrid>
```

Adding a fourth source later means adding a tile file. Nothing existing is edited, because no tile
knows about any other.

`PeakHourTile` and `ScheduledTodayTile` both derive from today's appointments. They call the same
hook, so Query deduplicates them into one request and one cache entry — the historical reason for
hoisting fetches up into the page does not apply here.

`lib/appointmentStats.ts` holds the logic currently buried in `statsApi`: bucketing appointments by
hour, selecting a peak, and building the by-hour and by-day breakdowns. These are pure functions
over an `Appointment[]`, which makes them directly unit-testable — today that logic has no tests of
its own.

`statsApi.ts` and the `DashboardStats` type are deleted, and its use of `simulateLatency` goes with
them.

### What the features expose

`features/patients` gains `useActivePatientCount()`, returning the count and a pending flag. The
tile should not know the figure comes from reading `totalCount` off a paginated list request; that
detail stays encapsulated behind the hook.

`features/appointments` gains `appointmentKeys` and `useAppointmentsQuery()`, returning the
appointment list. Derivation stays in the widget, because bucketing by hour is a dashboard concern
rather than an appointments one. `AppointmentsPage` is not touched and keeps its `useEffect`.

### Invalidation gets simpler

Because the tiles read the same cache entries the page already invalidates, the cross-boundary
invalidation disappears rather than becoming typed:

```ts
const afterWrite = (title: string) => {
  closePanel()
  queryClient.invalidateQueries({ queryKey: patientKeys.all })
  showToast({ tone: 'success', title })
}
```

The `queryKey: ['stats']` magic string is deleted, and no `statsKeys` factory replaces it, because
there is no longer a separate stats cache to invalidate. `TotalPatientsTile` refreshes because its
query lives under `patientKeys`.

## Swapping mocks for real endpoints

Only the patients endpoints exist today. Appointments is mock-backed, and the figures the dashboard
shows have no endpoint of their own. Nothing here fakes a UI state: the tiles render real numbers
derived from the appointments mock, exactly as the screen behaves today. What the design buys is a
single, obvious place to swap each source when a backend lands.

**The hook is the seam.** A tile renders what its hook returns and knows nothing about where the
value came from. Replacing a source therefore means rewriting one hook body:

| Figure                | Today                                          | When an endpoint exists          |
| --------------------- | ---------------------------------------------- | -------------------------------- |
| Active patient count  | `totalCount` off a paginated list request       | a count endpoint                 |
| Appointment list      | mock array behind `getAppointments`             | a real `GET`                     |
| Peak hour             | derived client-side in `appointmentStats`       | a server-computed stat endpoint  |
| Peak hours breakdown  | derived client-side in `appointmentStats`       | a server-computed stat endpoint  |

In every row the tile, its props and its tests are untouched. If a stats endpoint later returns
peak hours directly, `usePeakHourToday` becomes a plain `useQuery` and `appointmentStats` loses that
function; the derivation living behind a hook rather than inside a tile is what makes that a
one-file change.

**Marking the seams without comments.** Mock-backed data lives in files whose names begin with
`mock` — `mockData.ts` and `mockPatients.ts` today. `ls src/**/mock*` is then an accurate list of
everything still waiting on a backend, and unlike a comment it cannot go stale: deleting the file
is what marks the work done.

A future widget that needs data no feature owns yet gets a new feature slice with its own
`mock*.ts`, a key factory and a query hook, and the widget composes it like any other tile. No
existing tile changes.

## Public API surface

Pages reach slices through barrels, never through relative or deep paths.

`features/patients/index.ts` exports `PatientTable`, `PatientFilters`, `PatientFormPanel` and
`PatientDetailPanel`; `patientKeys`; `getPatient`, `getPatients` and `deletePatient`;
`useAllergenByName`, `usePatientsQuery` and `useActivePatientCount`; `parseFilterParams` and
`toFilterParams`; and the `PatientDetail`, `PatientListItem` and `PatientPage` types.

`PatientFilters` is both a component and an interface. The barrel exports the component under its
own name and the interface as `PatientFiltersType`, which is the alias `PatientsPage` already
applies locally, so no call site changes.

`features/patients/index.ts` no longer exports `PatientsPage` (moved to `pages/`) or `SPECIES_EMOJI`
(moved to `shared/`).

`widgets/dashboard/index.ts` exports `StatGrid`, `TotalPatientsTile`, `PeakHourTile`,
`ScheduledTodayTile` and `PeakHoursPanel`.

`features/appointments/index.ts` grows to cover what `AppointmentsPage` and the dashboard use:
`AppointmentDetailPanel`, `AppointmentFormPanel`, `CalendarToolbar`, `DayView`, `MonthView` and
`WeekView`; `getAppointments`, `createAppointment`, `updateAppointment` and `deleteAppointment`;
`appointmentKeys` and `useAppointmentsQuery`; `mockPatients` and `MockPatient`; `WEEKDAYS`; and the
`Appointment`, `AppointmentInput` and `CalendarView` types.

`features/auth/index.ts` grows to cover `PasswordField`, `useAuthOutlet`, `validateEmail`,
`validatePassword` and `validateRequired`, alongside what it already exports.

### The AuthForm stylesheet

`AuthForm.module.css` is imported by `AuthLayout` and `PasswordField`, which stay in
`features/auth`, and by `LoginPage` and `RegisterPage`, which move to `pages/`. It cannot simply
travel with the pages.

The auth barrel re-exports it:
`export { default as authFormStyles } from './components/AuthForm.module.css'`. This is mildly ugly
but honest — the stylesheet is genuinely part of what auth offers its pages, and the alternative is
a deep import that quietly breaks the rule being adopted. The cleaner eventual fix is an `AuthForm`
shell component so pages never touch raw class names; that is a refactor, not part of this change.

## Enforcement, and its limit

`.oxlintrc.json` gains the `import` plugin and `"import/no-cycle": "error"`. The rule reports 11
errors today and must report zero when the work is done. That is the objective check that the cycle
is gone.

oxlint does not support `import/no-restricted-paths`, so the downward-only layer rule itself stays a
convention: a stray upward import would compile and lint clean. `dependency-cruiser` could enforce
it as a dev dependency. It is deliberately not added here, to avoid introducing tooling that was not
asked for.

## Verification

`tsc -b`, `npm run build` and `npm run lint` stay clean, and `import/no-cycle` reports zero. The
pre-existing `only-export-components` warnings in `AuthContext.tsx` and `renderWithQuery.tsx` are
the only lint output.

The 150 existing tests must still pass. Most change only in their import paths, with one exception:
`PatientsPage.test.tsx` currently stubs the whole of `statsApi`, which no longer exists. It instead
needs `getAppointments` stubbed, because the dashboard tiles now reach appointments directly.

New tests cover `lib/appointmentStats.ts` — peak-hour selection including the empty and all-tied
cases, the by-hour buckets across the 07:00–20:00 range, and the Monday-first by-day ordering. This
logic is untested today.

## Follow-ups, not in this change

- Migrate `AppointmentsPage` onto `useAppointmentsQuery`; it still refetches with no race guard, and
  the hook will already exist.
- Extract an `AuthForm` shell component so pages stop importing raw CSS module classes.
- Add `dependency-cruiser` if the layer direction should be machine-enforced.
- Normalise `features/auth`'s thirteen absolute self-imports to relative paths, matching the other
  features.
