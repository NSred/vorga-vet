# Patients on real CRUD endpoints — design

Date: 2026-08-27
Status: implemented. Build order and execution findings live in
`docs/superpowers/plans/2026-08-27-patients-real-crud.md`.

## Goal

Replace every mock-backed read and write on the patients screen with the real backend endpoints.
After this change the patients feature holds no sample data: the table, the detail panel, the edit
form and delete all speak to the API.

## Scope

In scope: `GET /patients`, `GET /patients/{id}`, `PUT` and `DELETE`; deleting
`features/patients/api/mockData.ts` and everything reading it; the stat cards that counted mock
rows; cutting the appointments feature's dependency on patient mock data; moving the screen to
`/patients` and holding filter state in the URL.

Out of scope: `POST /patients`, already wired. Appointments as a feature — its calendar and forms
stay on mock data; only its import boundary changes. Backend changes of any kind.

## Backend contract

All endpoints require authorization. Enums serialize as integers, properties as camelCase.

| Method | Path             | Notes                                                                                    |
| ------ | ---------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/patients`      | `search`, `species`, `sex`, `allergenId`, `city`, `status`, `page`, `pageSize`           |
| GET    | `/patients/{id}` | adds `ownerId`, `breedId`, `anamnesis`, `note`, `createdAt`; allergies as `[{id, name}]` |
| PUT    | `/patients/{id}` | same body as `POST` minus the id, returns 204                                            |
| DELETE | `/patients/{id}` | soft delete, returns 204                                                                 |

`PatientStatusFilter`: Active 0, All 1, Deleted 2.

Behaviours worth knowing:

- `pageSize` is clamped server-side; below 1 or above 100 silently becomes 10. The page-size
  selector therefore stays within `[10, 20, 50]`.
- The handler always orders by `Name` ascending. There is no sort parameter.
- `DELETE` sets `IsDeleted` and stamps `DeletedAt`; the row keeps appearing under the All and
  Deleted filters. Deleting an already-deleted patient fails with `Patients.AlreadyDeleted`, not 404.
- `PUT` is a full replace including allergen links, and validates card-number uniqueness plus the
  existence of owner, breed and every allergen — so it returns the same error codes as create,
  plus `Patients.NotFound`.
- Species lives on `Breed`, not on `Patient`. Both responses project it from the joined breed.

## What the backend does not provide

Three things the old UI showed have no backing anywhere in the API. Each is resolved by removing
UI rather than inventing data.

| Mock-only data                | Resolution                                           |
| ----------------------------- | ---------------------------------------------------- |
| `visits[]`                    | Visit history section removed from the detail panel  |
| `totalServicesRsd`, `paidRsd` | Finances section removed; Debtors filter removed     |
| `mobile`                      | Field removed; only the owner's `phoneNumber` exists |

`age` is derived from `birthDate` instead, and `cardStatus` becomes the boolean `isDeleted`.

The "with allergies" stat card is removed for the same reason. `allergenId` filters by one
specific allergen and there is no "has any" variant, so the count is not expressible. Deriving it
from the current page would report "3 with allergies" out of a database of hundreds.

## Decisions

| Decision              | Choice                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| Pagination            | Server-side; `page` and `pageSize` drive the request                       |
| Sorting               | Removed. The API sorts by name only; client sorting would reorder one page |
| Allergy filter        | Allergen combobox sending `allergenId`                                     |
| Create and edit       | One `PatientFormPanel` with a `mode` prop, pickers live in both            |
| Owner prefill in edit | `ownerName` split on the first space — known limitation, see below         |
| Enum representation   | Unchanged: string unions on the frontend, ints at the API boundary         |
| Filter state          | Lives in the URL; the page holds no filter `useState`                      |
| Route                 | Patients moves to `/patients`; `/` redirects there                         |
| Allergen in the URL   | By name, resolved to an id through allergen search on load                 |

## The appointments boundary

`features/appointments` imported `Patient` and `getPatients` from `features/patients`, and its
mock appointments reference patient ids `p1`–`p8` that existed only in the patients mock. Deleting
that array would have left every calendar chip with no patient to render.

Pointing appointments at `GET /patients` would not help: real patients carry GUID ids that no mock
appointment references. So the mock moved rather than died — into
`features/appointments/api/mockPatients.ts`, with a local type holding only the eight fields
appointments actually reads. This leaves exactly one mock array in the codebase, owned by the
feature that still needs one, and it disappears when appointments gets its own endpoints.

## URL as filter state

A filtered patient list is something people share and return to. Previously the filters lived in
`useState`, so a reload dropped them and a pasted link opened an unfiltered table.

Values are the readable string unions used everywhere else, not the integers the API takes:
`?species=dog` survives being read by a human, `?species=0` does not. Anything at its default is
omitted, so the common case stays `/patients`. A filtered link reads
`/patients?search=rex&species=dog&status=all&page=2`.

`PatientsPage` derives its filters from `useSearchParams` on every render rather than mirroring
them into state. One source of truth: mirrored copies desynchronise the moment someone edits the
URL bar or hits Back. Changing a filter writes params without `page`, which is how "reset to page
1" is now expressed.

Unrecognised values are ignored, not fatal. `?species=dinosaur`, `?page=abc` and `?pageSize=999`
each fall back to their default and are dropped on the next write — a pasted or hand-edited link
must never break the page.

Every filter write uses `replace: true`. With the search box debounced, pushing would put a
history entry behind every pause in typing, so Back would crawl through half-typed queries instead
of leaving the screen.

**Resolving the allergen.** The URL carries a name, but the API filters by `allergenId` and the
combobox needs a name to label itself. There is no `GET /allergens/{id}`, so a cold load calls
`searchAllergens(name)` and takes the case-insensitive exact match. This is the one piece of
filter state the page keeps locally, because it cannot be derived from the URL synchronously; the
list fetch waits on it. `Allergen.Name` carries only a trigram index, not a unique constraint, so
duplicate names are unlikely but possible under concurrency — if it ever happens this filter picks
the first match.

## Known limitation: the owner name split

`GET /patients/{id}` returns the owner as a single concatenated `"First Last"` string, but
`OwnerPicker` needs the parts to build its `"Last First"` label. `splitOwnerName` splits on the
first space, which is knowingly lossy: "Ana Marija Petrović" yields first name "Ana" and last name
"Marija Petrović", so the edit form shows a wrong-looking label.

The blast radius is limited. Writes send `ownerId`, never the name, so a patient saved without
touching the owner field stays correctly linked and no owner record is modified. The damage is a
misleading label. A test pins the behaviour so the limitation is visible in the suite rather than
only here. The real fix is `OwnerFirstName` and `OwnerLastName` on `PatientDetailResponse`.

## Type strategy

The existing rule holds: integers appear only in `lib/enumMapping.ts` and never reach a component.
This change extends it to dates and adds an explicit DTO layer, because the wire shape and the UI
shape now differ enough that reusing one type would leak `species: 0` and `"2020-05-01T00:00:00"`
into JSX. Wire DTOs are suffixed `Dto` and consumed only by `api/patientsApi.ts` and
`lib/patientMapping.ts`.

`CreatePatientRequest` was renamed `PatientWriteRequest`, because `PUT` takes a byte-identical
body and a name saying "create" would mislead on the update path.

Dates: the backend sends `DateTime` as `"2020-05-01T00:00:00"`. Mapping slices the first ten
characters so every date in frontend state is the `YYYY-MM-DD` string that `dateOnly.ts` and
`DatePicker` already expect.

## Form panel: one component, two modes

`PatientCreatePanel` was generalised rather than duplicated, keeping `OwnerPicker`, `BreedPicker`
and `AllergenPicker` — including their inline create dialogs — live in both modes, so a user
correcting a record can still add a new owner or breed without leaving the form.

Four behaviours branch on mode: the initial card number is generated for create and taken from the
patient for edit; species changes regenerate the number only in create; a duplicate card number
gets one silent regenerate-and-resubmit in create but an immediate field error in edit; and submit
targets `createPatient` or `updatePatient`.

**Mount ordering matters.** `BreedPicker` clears its selection whenever `species` changes, which is
correct while editing but destructive if the panel mounts with the create default `'dog'` and only
afterwards resets to the patient's actual species. The panel is therefore rendered only once the
detail has loaded, and keyed on `patient.id`, so the form and its pickers mount exactly once with
the correct values.

## Error handling

| Case                              | Status | Code                               | Handling                                      |
| --------------------------------- | ------ | ---------------------------------- | --------------------------------------------- |
| List fetch fails                  | any    | —                                  | Error toast, empty table, filters stay usable |
| Detail fetch fails                | 404    | `Patients.NotFound`                | Close panel, toast, refresh list              |
| Save on a deleted patient         | 404    | `Patients.NotFound`                | Close panel, toast, refresh list              |
| Duplicate card number on edit     | 409    | `Patients.CardNumberNotUnique`     | Field error, focus, no retry                  |
| Referenced entity missing         | 404    | `Owners/Breeds/Allergens.NotFound` | Clear that picker, inline message             |
| Delete an already-deleted patient | 400    | `Patients.AlreadyDeleted`          | Treat as success, refresh                     |
| Validation failure                | 400    | —                                  | `validationMessages` shown in the panel       |
| Session expired                   | 401    | —                                  | Already handled globally by `apiFetch`        |

The rule from the create work carries over: the panel closes only on success, and every error path
leaves the form filled and open.

## Follow-up work

Recorded so it is not lost. The backend items are not part of this change.

- `OwnerFirstName` / `OwnerLastName` on `PatientDetailResponse`, retiring `splitOwnerName`
- Sort parameters on `GET /patients`, restoring sortable column headers
- A stats endpoint, restoring the "with allergies" card
- A cities endpoint, replacing the hardcoded city filter options
- `GET /allergens/{id}`, letting the URL carry an allergen id instead of a name
- A unique index on `Allergen.Name`, closing the concurrent-create race
- Visits and billing, which no endpoint covers and which this change removes from the UI
- Appointment endpoints, which would retire `mockPatients.ts` and the last mock array
