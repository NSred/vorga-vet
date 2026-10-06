# Frontend consolidation after the legacy-gap features

Status: Implemented. A refactor, not a feature. Follows the
[legacy-gap frontend work](2026-10-05-legacy-features-frontend.md) of 2026-10-05 and, like the
[hardening pass](2026-09-21-frontend-hardening-before-scheduling.md), changes shared code that
every later feature copies.

## What this adds

Almost nothing a user can see; the few small visible changes are listed under Notes. Every
existing test kept its assertions. The six features built on 2026-10-05 were each written as a
complete copy of the same stack, so the same plumbing existed in five or six places. After this
pass each feature holds only its own rules, and the pieces every feature needs (a local-storage
mock store, paged list parameters, a dialog with a form, a panel title, a form row, a section of
label-over-value fields) exist once in `shared/`.

| Measure, 2026-10-05 to 2026-10-06 | Before | After |
|---|---|---|
| Production TypeScript lines | 18,667 | 18,127 |
| CSS lines | 4,978 | 4,273 |
| Tests | 691 | 715 |

Seventeen files were deleted and thirty added, seven of them tests. The line count fell as the
review predicted; the file count rose, because shared pieces got their own files.

Out of scope: replacing any mock with a real endpoint (that is the
[backend proposal](2026-10-05-legacy-features-backend-api.md)), new UI, and any backend change.
Generated DTO types and MSW stay in the hardening document's "left for later".

## Backend contract

No endpoint is added, changed or called differently. The mock stores keep the request and
response shapes and the error codes of the backend proposal, because the point of the mocks is
that swapping in the real API later touches only the `api/*Api.ts` function bodies.

## Design

**Mock stores are domain rules on a shared engine.** `shared/lib/mockStore.ts` owns what every
`api/mock*Store.ts` repeated: the versioned local-storage state, the shape check, read, lazy
load, commit, reset and id generation. A store is created with its key, version, initial state
and an optional upgrade, and the feature file keeps only its validation and its list, create and
update rules. `shared/lib/mockApi.ts` owns the simulated network delay, the "400 with these
messages" helper and `catalogPage`, the filter, search, sort and paging both catalogue mocks did
by hand. `shared/lib/validation.ts` holds the small checks the mocks copied from each other.
Each store keeps its own message wording, because the tests and the backend proposal fix it
word for word. These helpers go away with the mocks when the backend lands.

**Paged lists share their vocabulary.** `Page<T>` and `mapPage` in `shared/domain/page.ts`
replace seven identical page interfaces and three hand-written DTO-to-domain page mappings.
`shared/lib/listParams.ts` reads and writes `search`, `status`, `page` and `pageSize` for a
feature-supplied spec, with extra filters written between `search` and `status` so every
screen keeps its URL order; the three parsers are thin wrappers that kept their names and tests.
`shared/ui/PagedTable` is the table, pagination and empty state, so a feature table declares
only its columns and messages.

**The catalogue screens share parts, not a component.** Diagnoses and the price list differ in
columns, filters and panel fields, so they stay separate screens. What they share as data, the
active/all/retired status, its API number, the filters and the query DTO, lives in
`shared/domain/catalog.ts`, because the backend proposal gives every retirable list the same
query shape. What they share as behaviour, the confirm-then-retire sequence and the Retire or
Restore button, lives in `shared/ui/RetireRestore`. The hook is in `shared/ui` rather than
`shared/lib` because it shows a toast, and nothing in `shared/lib` depends on `shared/ui`.

**One way to write a dialog.** `shared/ui/FormDialog` is `Modal` plus what every caller rebuilt:
the Cancel and submit buttons, an optional second action, the form element, its column layout,
the reset on open, and the `stopPropagation` that keeps a dialog's submit from also submitting a
form underneath it, such as the exam form. All eleven dialogs use it and all validate through
react-hook-form; `shared/lib/formRules.ts` has `textRule`, the trimmed "required, at most N
characters" rule they repeated. `apiErrorMessage` in `shared/lib/apiClient.ts` holds the logic
of six copied error-message helpers; `appointmentErrorMessage` and `examinationErrorMessage`
remain as one-line wrappers because they carry the feature's code-to-sentence map and about
twenty call sites use them.

**Panels and layout stop restating the same CSS.** `SlidePanel` takes `title`, `subtitle` and
`badge`; `ariaLabel` defaults to the title and is passed only where the dialog name differs.
Repeated layouts live in `shared/ui/layout.module.css`, exported as `layout`, with names for
what they do: `page`, `stack`, `stackTight`, `formRow`, `toolbar`, `toolbarGroup`, `note`. It is
a CSS module, not global classes, so the project keeps one styling mechanism. The inputs share
`shared/ui/field.module.css`, exported as `fieldStyles` for feature labels that imitate an
input label. `shared/ui/Details` holds `DetailSection`, `FieldGrid` and `Field`, used by both
detail panels, the patient summary and the Peak Hours panel.

**Appointments and patients.** `packLanes` is the one lane-packing step behind the day and
week timelines. The weekday table and helpers live in `shared/lib/clinicTime.ts`. Both
appointment pages get their owner and patient pickers from `usePartyFields` in `widgets/visit`.
`widgets/patientCard` assembles the patient detail panel with its vaccination, microchip,
reminder and visit sections and reads the role itself, so `PatientsPage` is back to list, URL,
delete and the visit edit panel. The visit edit panel stays on the page so that one widget does
not import another. `patientDetailQuery` in the patients feature is the single definition of
the patient-detail query that the page, `usePatientQuery` and `usePartyFields` share.

## Tasks

- [x] **Dead code and barrels.** Unused CSS, `Spinner`, `useExaminationQuery`, the disabled
      Print button and about fifty barrel exports nothing imported. Tests: suite unchanged,
      `tsc` proves nothing referenced what was removed.
- [x] **Shared mock engine.** Six stores and six API files on `mockStore`, `mockApi` and
      `validation`. Tests: every store test unchanged, plus an engine test.
- [x] **Paged-list vocabulary.** `Page<T>`, `listParams`, `PagedTable`, `useRetireRestore`,
      `apiErrorMessage`. Tests: the three parser tests unchanged, plus tests for each new piece.
- [x] **`FormDialog` and one form style.** Eleven dialogs on `FormDialog`, six moved to
      react-hook-form. Tests: dialog tests unchanged, plus a `FormDialog` test whose isolation
      case fails without the `stopPropagation` guard.
- [x] **Panel props, layout module, `Details`.** Ten panels on the title props, twelve
      stylesheets deleted. Tests: unchanged; panels are still found by their dialog names.
- [x] **Catalogue screens.** Diagnoses and price list on the shared hook, button, options and
      catalogue types. Tests: page, panel and table tests unchanged, plus `catalog.test.ts`.
- [x] **Appointments and patients.** `packLanes`, weekday helpers, one duration field,
      `usePartyFields`, `widgets/patientCard`. Tests: calendar and page tests unchanged, plus a
      `PatientCardPanel` test for the vet and client views.

## Where it lives

```
frontend/src/
  shared/domain/
    page.ts                       Page<T>, mapPage
    catalog.ts                    catalogue status, filters, query DTO, statusToApi, toCatalogQuery
  shared/lib/
    mockStore.ts                  versioned local-storage store, newId
    mockApi.ts                    settle delay, failValidation, assertValid, catalogPage
    validation.ts                 date, decimals, trimmed and required-text checks for the mocks
    listParams.ts                 oneOf, positiveInt, parse and write paged URL params
    formRules.ts                  textRule for react-hook-form
    text.ts                       plural
    apiClient.ts                + apiErrorMessage
    clinicTime.ts               + WEEKDAYS, MONDAY_FIRST_WEEKDAYS, clinicWeekday, weekdayName
    useEntitySearch.ts            pages typed as Page<T>
  shared/ui/
    layout.module.css             page, stack, stackTight, formRow, toolbar, toolbarGroup, note
    field.module.css              input wrapper, label and error, exported as fieldStyles
    Details/                      DetailSection, FieldGrid, Field
    FormDialog/                   Modal with a form, footer and reset on open
    PagedTable/                   Table, Pagination and empty state
    RetireRestore/                useRetireRestore, RetireRestoreButton, CATALOG_STATUS_OPTIONS
    SlidePanel/                 + title, subtitle and badge props
    index.ts                      components only, plus layout and fieldStyles
  features/*/api/mock*Store.ts    domain rules on createMockStore
  features/appointments/lib/
    lanes.ts                      packLanes for the day and week timelines
  features/patients/hooks/
    usePatientQuery.ts          + patientDetailQuery
  widgets/patientCard/            PatientCardPanel and certificateSubjectOf
  widgets/visit/hooks/
    usePartyFields.tsx            owner and patient pickers for booking, with the owner lookup
```

Deleted: `shared/ui/Spinner`, `features/examinations/hooks/useExaminationQuery.ts`,
`features/appointments/lib/dateHelpers.ts`, and twelve stylesheets whose rules moved to the
shared modules: the page modules for Lists, Patients, Price list and Reminders, and the modules
of `DiagnosesTab`, `ListTab`, `PatientFilters`, `PriceListToolbar`, `ExaminationEditPanel`,
`ExaminationFields`, `CreateDiagnosisDialog`, `CreatePriceItemDialog` and `VaccinationForms`.
The per-feature `*ErrorMessage` helpers for diagnoses, price list, vaccinations and microchips,
the `build…Query` functions and the `validation` entries in four error catalogs are gone too.

## Notes from implementation

- **A scan for unused CSS gives false positives here.** `AuthForm.module.css`, `layout` and
  `fieldStyles` are used through a re-exported default (`authFormStyles` and the two above), so
  a search for `styles.x` misses them.
- **The mock store cache lives in each store instance.** The store tests reload a module with
  `vi.resetModules()` and expect state back from local storage; a cache in the shared module
  would survive the reload and hide that.
- **`DatePicker.tsx` and a few other files were never Prettier-formatted.** Running Prettier on
  them reformats unrelated lines, so format only the files a change touches.
- **The CSS duplication target was only partly met.** Six small rule bodies still appear in
  three or more files: internal three-line layouts and the hover and focus states inside the
  shared inputs. Sharing them would couple unrelated components.
- **Visible changes, all small.** The allergen, breed and owner dialogs gained the 1 rem field
  spacing every other dialog had. Pressing Enter submits the six dialogs that used to validate by
  hand. The patient block in the appointment panel spaces its fields like the Appointment block
  above it. The Peak Hours title is the standard panel size. The microchip dialog's "Sterilised"
  label matches the date label beside it. Every input wrapper has `min-width: 0`.
- **Found while checking the rebuilt stack, not caused here, and fixed.** A client's visit
  windows asked for 62 clinic days, one hour more than the API's 62-day limit whenever a window
  crossed the end of daylight saving, so the API answered `Appointments.RangeTooWide`. The
  windows are now 61 days; see the [client appointments](2026-09-21-client-appointments.md)
  document.
