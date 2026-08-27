# Patients on real CRUD endpoints — implementation record

Status: implemented 2026-08-27. Design and rationale live in
`docs/superpowers/specs/2026-08-27-patients-real-crud-design.md`.

This was originally a step-by-step execution plan with full code inline. Now that the code is in
the repository that detail has been removed: the source is the truth, and a copy of it here would
only drift. What remains is the build order and what execution proved the plan wrong about.

## What was built

Frontend only. The backend was untouched.

**The API layer.** `patientsApi` lost its mock array and now calls all four endpoints.
`buildPatientsQuery` builds the query string and is tested on its own. A new `patientMapping`
converts wire DTOs to domain types — integer enums through `enumMapping`, `DateTime` sliced to
`YYYY-MM-DD`, `null` optionals normalised to `undefined`.

**Server-side paging.** `page` and `pageSize` moved up to `PatientsPage`; `PatientTable` became
presentational. Sortable headers were dropped, since the API orders by name and offers no sort
parameter.

**URL as filter state.** Filters, page and page size live in the URL through
`patientFilterParams`. The patients screen moved from `/` to `/patients`, with `/` redirecting.

**Allergen filter.** The hardcoded allergy enum select became a combobox backed by `/allergens`.
`Combobox` gained an `onClear` prop so a selection can be cleared without the Reset button.

**One form, two modes.** `PatientCreatePanel` became `PatientFormPanel` with `mode`, keeping the
owner/breed/allergen pickers and their create dialogs live in both. The old mock-based
`PatientFormPanel` was deleted.

**Appointments cut loose.** The patient mock moved to `features/appointments/api/mockPatients.ts`
with a trimmed local type, and `features/patients` stopped exporting `Patient` and `getPatients`.

**Removed for lack of a backend.** The Finances and Visit history panel sections, the Debtors
filter, and the "with allergies" stat card.

## Build order

Nine tasks. Tasks 1-5 were additive and kept the build green; task 6 was a cutover.

1. Move the patient mock into appointments
2. `calculateAge` and `splitOwnerName`
3. Types and DTO mapping; `CreatePatientRequest` renamed `PatientWriteRequest`
4. `parseFilterParams` / `toFilterParams`
5. `Combobox.onClear` and `AllergenFilter`
6. The cutover: API layer, stats, table, filters, detail panel, form panel, page
7. Route move to `/patients`
8. URL, page, edit-mode and debounce tests
9. Full verification

Task 6 had to land as one commit-sized unit. `PatientsPage`, `PatientTable`, `PatientDetailPanel`
and `patientsApi` are mutually dependent through the `Patient` type, and no ordering keeps
`tsc` green in between. The plan said so up front rather than pretending otherwise.

## What execution changed

The parts worth reading. Each was wrong in the plan and only surfaced while running the real
thing.

**A pending flag that never settled.** `isAllergenPending` was derived from
`allergen?.name !== allergenName`. When a URL carried an allergen name the backend did not know,
the resolution returned no match, the derived flag stayed true forever, and the table hung on a
permanent loading skeleton. Any link with a stale or mistyped `?allergen=` froze the page. Fixed
by storing the resolution as `{ name, option }` so "resolved to nothing" is representable and
distinct from "not resolved yet". Caught by a test, then confirmed against the live backend.

**Delete reported success on every failure.** `handleDelete` wrapped the call in a bare
`try/catch` and then called `afterWrite('Patient deleted')` unconditionally. A 500, a dropped
connection or a body-parsing error would all have shown a success toast while the record
survived. Now only `Patients.NotFound` and `Patients.AlreadyDeleted` are forgiven — both genuinely
mean the row is gone — and everything else raises an error toast.

**The route move broke the nav pill.** `AppLayout` positions its sliding highlight from
`pathname === '/'`, duplicating the routing logic that `NavLink` already owns. Moving patients to
`/patients` sent the pill to Appointments, and since `NavLink` still correctly marked Patient
Records active, that link rendered white-on-white. The plan listed `AppLayout.tsx` as a file to
touch but only for the `to` prop. Fixed by reading `[aria-current="page"]` from the DOM, so the
pill follows react-router's own notion of active and cannot drift again.

**Two counts in the plan were wrong.** The mock had 8 patients, not 9 — the ninth `id:` the plan
counted belonged to a nested visit. The API test suite came to 8 cases, not 9.

**Testing gotchas.** Playwright's `fill()` does not register with react-hook-form's dirty
tracking, which made the discard guard look broken when it was not; real keystrokes work, and the
jsdom tests use `user.type()`. Radix `Select` opens with the current value highlighted, so
reaching the second option from a three-option list needs two `ArrowDown`s, not one.

## Follow-on work in the same branch

Requested after the plan was complete, so not part of the nine tasks:

- Confirm before discarding unsaved changes when leaving edit mode, gated on `isDirty`
- Birth-date validator switched to `todayIso()` so it agrees with the DatePicker's `maxDate`
  instead of comparing against UTC
- `shouldFocus` on the duplicate-card-number error
- Deleted rows faded and struck through, via a new `rowClassName` prop on `Table`
- Colours unified on `tokens.css`: 34 hardcoded hexes reduced to 7 intentional gradient stops

## Follow-up work

Not part of this change. The backend items belong to whoever owns the backend.

- `OwnerFirstName` / `OwnerLastName` on `PatientDetailResponse`, retiring `splitOwnerName`
- Sort parameters on `GET /patients`, restoring sortable column headers
- A stats endpoint, restoring the "with allergies" card
- A cities endpoint, replacing the hardcoded city filter options
- `.Produces(StatusCodes.Status204NoContent)` on the delete endpoint, so its OpenAPI document
  stops advertising 200 when it returns 204
- Appointment endpoints, which would retire `mockPatients.ts` and the last mock array
- Stylelint with `color-no-hex` outside `tokens.css`, to stop colour literals creeping back
