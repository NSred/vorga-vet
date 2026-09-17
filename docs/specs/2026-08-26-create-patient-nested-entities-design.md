# Create patient with nested entity creation — design

Date: 2026-08-26
Status: approved, ready for implementation planning

## Goal

Wire the "New patient" form to the real backend `POST /patients` endpoint. While filling the
form, the user picks an existing owner, breed, and allergens from searchable dropdowns. When
the entity they need does not exist, they create it inline without losing the patient form.

## Scope

In scope:

- Real API integration for creating a patient, and for searching and creating owners, breeds,
  and allergens.
- A reusable async combobox primitive and a centered modal primitive.
- Toast notifications.
- Vitest + Testing Library setup and tests for the logic this feature introduces.

Out of scope:

- The patient table, stat cards, filters, detail panel, and edit flow all keep reading mock
  data. They are untouched.
- `GET /patients` does not exist on the backend, so a created patient will not appear in the
  table. This is a known and accepted gap.
- Species creation. Species is a fixed enum, not an entity (see below).

## Backend contract

All endpoints require authorization. Search endpoints return at most 20 rows
(`MaxResults = 20`), which is why every picker uses server-side typeahead rather than loading
a full list.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| POST | `/patients` | `ownerId`, `breedId`, `cardNumber`, `name`, `sex` (int), `birthDate?`, `weightKg?`, `color?`, `chipNumber?`, `anamnesis?`, `note?`, `allergenIds[]` | `Guid` |
| GET | `/owners?search=` | — | `[{ id, firstName, lastName, phoneNumber }]` |
| POST | `/owners` | `firstName`, `lastName`, `phoneNumber`, `address`, `city` | `Guid` |
| GET | `/breeds?species={int}&search=` | `species` is required | `[{ id, name }]` |
| POST | `/breeds` | `name`, `species` (int) | `Guid` |
| GET | `/allergens?search=` | — | `[{ id, name }]` |
| POST | `/allergens` | `name` | `Guid` |

Enums are serialized as integers and property names as camelCase (ASP.NET Core defaults; the
project adds no custom JSON configuration).

- `Species`: Dog 0, Cat 1, Bird 2, Other 3. Lives on `Breed`, not on `Patient`.
- `Sex`: Male 0, Female 1.

Behaviors worth knowing:

- `POST /breeds` and `POST /allergens` are idempotent. A case-insensitive name match (plus
  species, for breeds) returns the existing id instead of failing. Neither can produce a
  duplicate error.
- `POST /owners` does not deduplicate. Creating the same person twice produces two owners.
- Owner search matches first name, last name, and full name. It does not match phone number.
- The backend validates that `BreedId` exists, but not that the breed's species matches
  anything else on the request.

## Decisions

| Decision | Choice |
| --- | --- |
| Table after create | Stays on mock data. Create-only integration. |
| Nested create UI | Stacked Radix Dialog over the slide panel. |
| Fields the backend rejects | Dropped, derived, or shown read-only. |
| Post-create feedback | Close panel, show success toast. |
| Picker architecture | Shared primitives with three purpose-built pickers. |
| Enum representation | String unions on the frontend, mapped to ints at the API boundary. |
| Testing | Vitest + Testing Library. |
| Card number | Client-generated string, formatted `{species}{yy}-{5 digits}`. |

## Card number

`CardNumber` stays a client-supplied `string`, separate from the `Guid` primary key. No
backend change is involved; a colleague owns the backend.

A database-assigned integer identity column was considered and rejected. It would guarantee
uniqueness without a round trip, but it would lock the card number into being a plain
incrementing integer. Keeping it a string leaves room for a meaningful format.

### Format

`generatePatientCardNumber()` is rewritten to produce `{speciesLetter}{yy}-{5 random digits}`:

```
D26-04821   dog,   registered 2026
C26-17390   cat,   registered 2026
B26-08654   bird,  registered 2026
O26-22107   other, registered 2026
```

Species letters are D, C, B, O, derived from the same species union used everywhere else. Nine
characters, well inside the backend's 20-character limit. The number tells a reader the
species and the registration year without a lookup.

The random component is unavoidable: with no `GET /patients`, the frontend cannot know which
numbers already exist, so sequential numbering is not possible without the backend. The year
segment does reduce collisions over time, since each year starts a fresh namespace.

### Regeneration and editing

Species is chosen inside the form, so the number cannot be generated once when the panel
opens. It regenerates whenever species changes, unless the user has edited the field by hand.
React Hook Form's `dirtyFields.cardNumber` distinguishes the two cases. The field stays
editable throughout, so a clinic with its own numbering convention can override it.

### Collision handling

Uniqueness is enforced by the unique index in `PatientConfiguration`, and the handler's
`AnyAsync` pre-check turns the common case into a clean 409.

On a 409 the frontend regenerates the number and resubmits once, automatically. The number is
machine-generated and carries no user intent, so making the user fix it by hand would be
asking them to solve a problem they did not create. If the retry also returns 409, the error
becomes a field error on `cardNumber` for manual resolution.

The automatic retry applies only when the field is untouched. If the user typed the number
themselves, a 409 goes straight to a field error, since silently replacing a value someone
deliberately entered would be worse than reporting it.

One limitation stays, recorded under follow-up work: the pre-check is not atomic. Two
concurrent creates can both pass it, and the losing insert violates the unique index and
surfaces as a 500 rather than a 409. That is a backend fix.

## Type strategy

Frontend keeps string unions (`'dog'`, `'female'`). Integers appear in exactly one module and
never reach a component. Rationale: `speciesEmoji.ts` keys its map by species string, and
`PatientFilters` puts species into URL search params, where `?species=dog` is readable and
`?species=0` is not. String unions also fail loudly at the boundary if the backend reorders an
enum, where integers would silently corrupt data.

Model rules:

- Identical wire and UI shape means one type and no mapping. `{ id, name }` for breeds and
  allergens is used directly.
- A small display difference keeps the DTO and derives in the component. The owner dropdown
  label is built from `firstName` and `lastName` where it is rendered.
- A genuinely different shape gets two types with mapping in `api/`. The flat FK-based
  `CreatePatientRequest` and the existing view-model `Patient` stay separate.

All mapping lives in `api/` modules. No component sees `sex: 1`.

C# to TypeScript: `Guid` becomes `string`, `DateTime`/`DateTime?` become ISO `string` and
`string | undefined`, `decimal?` becomes `number | undefined`.

## Architecture

### New shared primitives

- `shared/ui/Combobox/` — presentational async combobox built on Radix Popover. Owns the
  popover, keyboard navigation, loading and empty states, and the `＋ Create "…"` footer row.
  Does not fetch. The existing `Select` is left untouched: it wraps Radix Select, which does
  not support async search or multi-select.
- `shared/ui/Modal/` — centered Radix Dialog for the create sub-forms. A sibling of
  `SlidePanel`, which is side-anchored, not a refactor of it.
- `shared/ui/Toast/` — provider plus `useToast`, built on `@radix-ui/react-toast` (new
  dependency). Chosen over a hand-rolled toast for correct `aria-live`, timers, and
  swipe-dismiss, and for consistency with the three Radix packages already in use.
- `shared/lib/useDebouncedValue.ts` — 300ms debounce.

### New API modules

`features/patients/api/ownersApi.ts`, `breedsApi.ts`, and `allergensApi.ts`, each exporting a
search and a create function over the existing `apiFetch`, following the shape of
`features/auth/api/authApi.ts`. They live under `patients/` because that is their only
consumer today, and can be promoted when owners get a dedicated screen.

`patientsApi.ts` gains a real `createPatient`. Its mock `getPatients`, `updatePatient`, and
`softDeletePatient` are unchanged.

`features/patients/lib/enumMapping.ts` holds the species and sex integer maps.

### New feature components

```
features/patients/hooks/useEntitySearch.ts   debounce + fetch + loading/error state
features/patients/components/pickers/
  OwnerPicker.tsx           single-select, read-only contact summary once picked
  BreedPicker.tsx           single-select, species-dependent
  AllergenPicker.tsx        multi-select with chips
  CreateOwnerDialog.tsx     5 required fields
  CreateBreedDialog.tsx     name, with species prefilled and locked
  CreateAllergenDialog.tsx  name only
```

Shared logic lives in `useEntitySearch` and `Combobox`. The differences between the three
entities stay visible in their own components rather than hidden behind conditional props on
one generic component.

### Create and edit are separate panels

`PatientFormPanel` currently serves both create and edit. Edit stays on mock data, where a
patient carries `breed` and `ownerName` as plain strings, while create moves to pickers holding
objects. One component cannot hold both shapes without branching on `mode` in every field, so
create moves to a new `PatientCreatePanel` and `PatientFormPanel` is left untouched for edit.

The duplication is temporary and deliberate. When `GET /patients` lands and edit moves to the
real API, the two converge and `PatientFormPanel` can be retired.

### Modified existing files

- `PatientsPage.tsx` — renders `PatientCreatePanel` for create, calls the real API, raises a
  toast. The edit and view branches are unchanged.
- `shared/lib/apiClient.ts` — `ApiError` gains `code` and `validationMessages`.
- `shared/ui/index.ts` — exports the new primitives.
- `app/App.tsx` — mounts the toast provider.
- `features/patients/types.ts` — adds request and option types.
- `features/patients/api/patientsApi.ts` — adds the real `createPatient`; the mock read
  functions stay.

## Form flow

Field layout in create mode:

```
No. *              Name *
Owner *  [picker]
  once picked: read-only "060/7301103"
Species  [select]  Breed *  [picker, disabled until species set]
Sex      [select]  Date of birth [datepicker]
Weight (kg)        Color
Chip no.
Allergens [multi-picker, chips]
Medical history [textarea]
Note            [textarea]
```

Removed from the form: `age`, `phone`, `mobile`, `address`, `city`, `totalServicesRsd`,
`paidRsd`. Phone, address, and city belong to the owner and are captured in the create-owner
dialog. Age is derivable from birth date. The financial fields are not entry data for a new
patient and have no backend equivalent.

Only the phone number appears read-only under the owner picker. `SearchOwnersResponse` returns
`id`, `firstName`, `lastName`, and `phoneNumber` and nothing else, so address and city are not
available to display without another endpoint.

Behavior:

- Species is a UI-only field. It is not part of `POST /patients`, because species lives on
  `Breed`, not on `Patient`. Its only jobs are to scope the breed search and to prefill the
  create-breed dialog.
- The card number is generated client-side and regenerates when species changes, unless the
  user has edited it (see "Card number").
- The breed picker is disabled until species has a value, and changing species clears the
  selected breed. Without this the form can submit a Chartreux with species Dog, because the
  backend checks only that the breed id exists.
- Pickers store the whole selected object in form state (`owner: OwnerOption | null`), not a
  bare id. Storing ids alone would force parallel local state for display labels, and the two
  copies drift. Ids are extracted once, during submit mapping.
- Create endpoints return only a `Guid`. After a successful create the picker builds the new
  option from that id plus the values just submitted in the dialog, selects it, and closes.
  No refetch.
- Clicking `＋ Create "Bichon"` prefills the breed dialog's name. Same for allergens. The
  owner dialog prefills nothing, because splitting a typed string into first and last name is
  guesswork that is more annoying to correct than to retype.

## Validation

Client-side rules mirror the backend FluentValidation validators so errors surface before the
request. The backend remains authoritative.

| Field | Rule |
| --- | --- |
| Card number | required, max 20 |
| Name | required, max 100 |
| Owner, breed | required |
| Weight | greater than 0 when set |
| Date of birth | not after today when set |
| Owner dialog | all five required; max 100 / 100 / 30 / 200 / 100 |
| Breed dialog | name required, max 100 |
| Allergen dialog | name required, max 100 |

## Error handling

`CustomResults.Problem` maps domain errors to RFC 7807 responses:

| Case | Status | `title` |
| --- | --- | --- |
| Duplicate card number | 409 | `Patients.CardNumberNotUnique` |
| Referenced entity missing | 404 | `Owners.NotFound`, `Breeds.NotFound`, `Allergens.NotFound` |
| Validation failure | 400 | plus an `errors` array extension |

`apiClient.ts` currently reduces the response to `detail ?? title ?? statusText` and discards
everything else. `ApiError` therefore gains two optional properties: `code` (from `title`) and
`validationMessages` (the `description` of each entry in the `errors` array). `message` keeps
its current meaning, so existing callers are unaffected.

Note on 400 responses: the property name does not reach the client.
`ValidationDecorator.CreateValidationError` builds each error from FluentValidation's
`ErrorCode`, not its `PropertyName`, so an entry looks like
`{ code: "NotEmptyValidator", description: "'Name' must not be empty." }`. Mapping a 400 back
to a specific form field is therefore impossible without a backend change, and those messages
are shown in a toast instead. Because client validation mirrors the backend rules, a 400 means
the two have diverged, which should be rare.

Handling:

- 409 duplicate card number regenerates the number and resubmits once when the field is
  untouched. If that retry fails, or if the user typed the number themselves, it becomes a
  field error on `cardNumber` with focus. No toast; this is a field problem. The 409 is
  identified by `code === 'Patients.CardNumberNotUnique'`, which does survive as `title`.
- 400 validation shows the collected `description` messages in an error toast.
- 404 on a picked entity clears that picker and toasts a message asking the user to select
  again.
- 401 is already handled globally by `apiFetch` (refresh, then `onUnauthorized`).
- Network failures and 500s produce a generic error toast.

The panel closes only on success. Every error path leaves the form filled and open, and the
same rule applies to the create dialogs. Losing a half-filled form to a transient failure is
the worst outcome available here and is cheap to prevent.

## Testing

The frontend currently has no test framework. Vitest, `@testing-library/react`, and jsdom are
added as part of this work, along with a `test` script. This is setup every later feature
reuses.

Tests cover:

- Enum mapping in both directions, including unknown values.
- Form values to `CreatePatientRequest` mapping, including omitted optional fields and
  allergen id extraction.
- `ApiError` parsing: code and field errors extracted from a ProblemDetails body.
- Error to field mapping, including the PascalCase to camelCase normalization and the
  unmatched-field fallback.
- `generatePatientCardNumber()`: correct species letter and two-digit year, five-digit tail,
  and length within the backend limit.
- Card number regenerates when species changes, and does not regenerate once the field has
  been edited by hand.
- 409 retry: one automatic regenerate-and-resubmit when untouched, a field error on the second
  409, and a field error immediately when the field is dirty.
- `useEntitySearch`: debounce behavior and loading and error states.
- `BreedPicker`: disabled until species is set, and selection cleared when species changes.
- Create-then-autoselect: a successful dialog create selects the new option and closes.
- The panel stays open on a failed submit.

## Follow-up work

Not part of this change, recorded so it is not lost. The backend items belong to whoever owns
the backend, not to this work.

- `GET /patients`, then switching the table off mock data.
- Edit patient against the real API.
- Server-side card number generation, which would make the number sequential per species and
  remove the collision retry entirely. Any scheme has to keep the column a string so the
  `{species}{yy}-{n}` format still fits.
- Making the uniqueness check atomic, by catching the unique-index violation in the handler
  and returning `CardNumberNotUnique` instead of letting it surface as a 500.
- Owner deduplication, or a warning in the create-owner dialog when a similar name already
  exists.
