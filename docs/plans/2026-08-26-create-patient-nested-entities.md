# Create patient with nested entity creation — implementation record

Status: implemented 2026-08-26. Design and rationale live in
`docs/superpowers/specs/2026-08-26-create-patient-nested-entities-design.md`.

This was originally a step-by-step execution plan with full code inline. Now that the code is
in the repository, that detail has been removed: the source is the truth, and a copy of it here
would only drift. What remains is the build order and what execution proved the plan wrong
about.

## What was built

Frontend only. The backend was untouched.

**Test tooling.** The frontend had no test framework. Added Vitest, Testing Library and jsdom
with `npm test`. The setup file polyfills the pointer-capture APIs jsdom lacks but Radix Select
needs, without which any test touching a Select throws.

**`ApiError` detail.** `apiClient` collapsed every failure to a message string, so a duplicate
card number could not be told apart from any other 4xx. It now also carries `code` and
`validationMessages`.

**Shared primitives.** `Combobox` (async search on Radix Popover with a create-new row),
`Modal` (centered dialog for sub-forms) and `Toast` (provider plus `useToast`, mounted at the
app root).

**DatePicker.** An optional `maxDate` disables future days, months and forward navigation, and
the year caption opens a 12-year grid that pages a full page at a time.

**Lookup data layer.** Search and create clients for owners, breeds and allergens, the
enum/request mapping modules, and `useEntitySearch` for debounced typeahead.

**Pickers.** One picker per entity, each paired with its own create dialog.

**The create flow.** A new `PatientCreatePanel` posting to the real `POST /patients`.

## Build order

Seven commits, each building and testing green on its own:

1. Tooling and dependencies
2. `ApiError` code and validation messages
3. `Combobox`, `Modal`, `Toast`
4. `DatePicker` `maxDate` and year grid
5. Lookup APIs and mapping helpers
6. Pickers and create dialogs
7. Wiring: `PatientCreatePanel`, real `createPatient`, `PatientsPage`

The last three files had to land together. Replacing the mock `createPatient` breaks
`PatientFormPanel` and `PatientsPage`, so splitting them would have left a broken commit.

## What execution changed

The parts worth reading. Each of these was wrong in the plan and only surfaced while running
the real thing.

**Nested dialog submits leaked into the patient form.** Submitting a create dialog also
submitted the patient form behind it. React portals escape DOM nesting but not synthetic event
bubbling, so the dialog's submit propagated to the wrapping `<form>`. With a filled form this
would have posted the patient the moment an owner was created. Fixed with `stopPropagation` in
all three dialogs. Unit tests missed it because they render each picker standalone, where the
nesting does not exist; only the browser check caught it.

**The card number never regenerated when species changed.** The guard used React Hook Form's
`dirtyFields`, but the panel's own mount-time `setValue` made the field look user-edited, so
the guard blocked every regeneration. Replaced with an explicit ref that tracks real user
edits.

**Birth dates returned 500.** The form sent `2026-02-02`, which ASP.NET parses as a `DateTime`
with `Kind=Unspecified`, and Npgsql refuses to write that to a `timestamptz` column. The
frontend now sends an explicit UTC instant. This is a workaround: `birth_date` should be a
`date` column, since a birth date has no time or timezone. As it stands the value can shift a
day across timezones once the table reads real data.

**One test was dropped.** Future-date validation is implemented but not tested. Exercising it
through the custom calendar needed brittle month navigation, and the rule is already
unreachable through the UI now that future days are disabled.

Two later changes came from review rather than execution: `DatePicker` was migrated to
`react-day-picker` and then reverted to the custom implementation, and the year grid was added
afterwards.

## Verification

79 tests pass, build and lint clean. The full flow was confirmed against the running Docker
stack: a patient reached Postgres with the correct owner, breed, species integer and allergen
join rows.

## Not done

Carried over to the spec's follow-up list, most of it backend work:

- `GET /patients`, so the table can stop using mock data. This is the blocker for the rest of
  the feature, including edit.
- `birth_date` as a `date` column.
- Server-side card number generation, and catching the unique-index violation so a collision
  returns 409 rather than 500.
- Arrow-key navigation in the calendar, the one accessibility gap versus a native date input.
