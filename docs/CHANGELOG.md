# Changelog

One entry per work session, newest first. Each entry links the feature document that holds the
details.

## 2026-10-06 — Phone patterns

Frontend only. 141 test files, 770 tests, typecheck and lint clean. Checked on a phone and on
desktop against the real API as the vet and the client.

- Main actions sit in a bottom bar on phones, with a floating New patient button; toasts and page
  padding make room for it. Dialogs become bottom sheets on phones.
- Day view gets a week strip with dots and a current-time line; week view becomes an agenda on
  phones; tapping a month day previews its visits.
- The appointment panel shows a Scheduled → Checked in → Completed stepper with the next step as
  the main button and Open record in the Patient heading.
- Booking and rescheduling pick a time from a slot grid, with taken slots crossed out for vets,
  and the type from colour cards.
- Patient card sections show counts and add buttons in their headings; the panel has age, weight
  and sex tiles; the form picks species from chips and sex from a switch.

Details: [document](specs/2026-10-06-phone-patterns.md)

## 2026-10-06 — Shared visual system

Frontend only. 133 test files, 744 tests, typecheck and lint clean. Desktop changes on purpose;
before-and-after screenshots of eleven screens on desktop and phone against the real API.

- The app uses Figtree, bundled with it, and the design's palette and rounder shapes, keeping
  our darker grey for small text and input borders for contrast.
- All five input kinds share one field shell and focus ring; labels are normal case with a red
  asterisk; a text field can show a unit such as "kg".
- Detail panels and forms group content into section cards on a grey panel body; the patient
  form splits into Identity, Animal and Medical.
- The patient and appointment panels open with a tinted header of card number or type, title and
  status chips.
- The segmented control has a white tab on a grey track and optional counts; empty states can
  carry an icon and a hint; the header has a brand mark and a Log out pill.

Details: [document](specs/2026-10-06-visual-system.md)

## 2026-10-06 — Mobile layout

Frontend only. 129 test files, 733 tests, typecheck and lint clean. Desktop screenshots are
pixel-identical before and after; the phone layout was checked against the real API at 390×844
and 360×740 as a vet and as a client.

- The page no longer scrolls sideways on a phone; side panels fill the screen as sheets with
  their title and actions fixed.
- The header becomes two rows with all tabs in a swipeable strip; the active tab stays in view.
- The patients and report tables turn into cards on phones, through a new `mobile` option on
  `Table` columns.
- The calendar opens in day view on a phone, jumps to today in the week view and shows a tappable
  count per day in the month view.
- Controls reach 44px on touch phones. Print buttons are hidden on phones; issuing a rabies
  certificate or registering a microchip there saves the record without printing.
- Fixed: picking a day from the week or month view opened the previously shown date instead.

Details: [document](specs/2026-10-06-mobile-layout.md)

## 2026-10-06 — Dropdowns scroll with the mouse wheel

Frontend only. 127 test files, 716 tests, typecheck and lint clean, production build passes.

- A `Select` list is capped at the height left in the window, so long lists such as start
  time, surgery duration and medication unit scroll instead of running off the screen.
- A `Combobox` popover is modal, so its list scrolls with the wheel inside panels and modals,
  and scroll paging in the patient, price list and diagnosis pickers triggers again.

Details: [document](specs/2026-10-06-dropdown-wheel-scroll.md)

## 2026-10-06 — Frontend consolidation

Frontend only. 127 test files, 715 tests, typecheck and lint clean, production build passes.

- The six mock stores run on one shared local-storage engine; each keeps only its own rules and
  message wording, and demo data already saved in a browser still loads.
- Paged lists share `Page<T>`, one URL-param reader and writer, and `PagedTable`; diagnoses and
  the price list share their catalogue types, retire/restore hook and button.
- All eleven dialogs use `FormDialog` and react-hook-form; error messages come from one
  `apiErrorMessage`.
- Panels take `title` and `subtitle`; repeated layout and input-label CSS lives in two shared
  modules, and twelve stylesheets were deleted.
- The calendar's lane packing, the weekday helpers, the booking pickers and the patient card are
  each written once; `widgets/patientCard` takes the detail sections out of the patients page.
- Production TypeScript went from 18,667 to 18,127 lines and CSS from 4,978 to 4,273.
- Fixed: a client's visit lists failed to load when their window crossed the end of daylight
  saving, because 62 clinic days came out one hour over the API's 62-day limit. The windows are
  now 61 days.

Details: [document](specs/2026-10-06-frontend-consolidation.md)

## 2026-10-05 — Calendar day and week as timelines

Frontend only. 121 test files, 691 tests, typecheck and lint clean.

- The day and week views are time grids of half-hour rows, and each visit is one block as long as
  the visit, with time range, patient, owner and a duration badge ("2h"). Overlapping visits sit
  side by side; the week's three-visit limit and "+N more" link are gone.
- Week day headers show the weekday, date, Closed when the clinic is shut and the number of
  visits, and open that day. Hours outside opening time are shaded and today is tinted.
- In the day view a free row is the Book button, and completed, cancelled and no-show visits are
  solid grey instead of faded.
- `layoutDay` in `lib/daySlots.ts` replaces `buildDayRows`, and `layoutWeek` in `lib/weekGrid.ts`
  works in clinic-local minutes so days with different opening hours share one set of rows.

## 2026-10-05 — Legacy-gap features on the frontend

Frontend only, on mock data where the backend has no endpoint yet. 121 test files, 691 tests,
typecheck and lint clean. ([document](specs/2026-10-05-legacy-features-frontend.md))

- New vet-only pages: **Price list** (services and medications, retire and restore), **Lists**
  (diagnoses with codes and paste a list; breeds and allergens on the real endpoints),
  **Reminders** (overdue and coming due, with the owner's phone) and **Reports** (daily report,
  unpaid exams, deleted cards). Each keeps its view in the URL.
- The exam's typed Cost is replaced by charges picked from the price list plus additional cost
  lines; a vaccine given on an exam records a vaccination with its next due date, and the
  diagnosis is picked from the list or typed.
- The patient card gains vaccinations, reminders and a microchip section, and prints a rabies
  certificate and a microchip registration sheet in Serbian on A4. The owner's JMBG is printed
  but never stored.
- Booking takes the owner from the chosen patient, a full day offers **Next free day**, and search
  dropdowns load when opened and fetch the next page on scroll.
- Price list, charges, diagnoses, vaccinations, certificates and microchips run on mocks saved to
  local storage in the shape of the
  [backend API proposal](specs/2026-10-05-legacy-features-backend-api.md); reports read every
  patient's exams until a reports endpoint exists.
- Repeated UI moved to `shared`: `PrintDocument`, `RecordList`, `PageHeader`, `FormError`,
  `Checkbox`, `useSearchDraft`, `usePanelState`, paged `useEntitySearch`, `money.ts` and the
  Serbian print labels. The day's seven documents were merged into one, and the
  [overview](specs/2026-10-04-legacy-program-gap.md) points to it.

## 2026-10-04 — Test environment on Render and Neon

Backend and DevOps. 224 backend tests pass (134 unit, 6 architecture, 84 integration), run in a
Linux container because of a local Application Control policy.
([document](specs/2026-10-04-render-test-environment.md))

- Migrations run when `Database:MigrateOnStartup` is set instead of only in Development, so the
  hosted API runs as Production without Swagger, stack traces or committed secrets.
- New `health/live` endpoint that skips the database check, used by Render and the optional
  keep-awake pinger so Neon can still suspend.
- The base configuration logs to the console; before this a Production container logged nothing.
- `devops/render.yaml` describes the frontend static site and the API, deploying from `main`
  after CI passes; `devops/README.md` is the setup runbook.

## 2026-09-21 — Client appointments

Frontend only. 83 test files, 469 tests, typecheck, lint and build clean.
([document](specs/2026-09-21-client-appointments.md))

This completes the five appointment sub-projects planned on 2026-09-17.

- `/appointments` now serves both roles: the calendar for a veterinarian, a client's own visits
  page for a client, chosen by a small role-aware route element.
- A client sees their upcoming and past visits, split by status so an unresolved visit never
  disappears, and can book, reschedule or cancel their own.
- The booking form gained a client variant: no surgery, no duration, no owner field, and the
  client's own booked slots shown as "yours" rather than as free time.
- Clients without a linked owner record book a thin visit and are told the clinic will match it
  to their animal on arrival, which is the flow the backend expects.

## 2026-09-21 — Examinations and attachments

Frontend only. 81 test files, 444 tests, typecheck, lint and build clean.
([document](specs/2026-09-21-examinations-and-attachments.md))

- Visit history in the patient detail panel: every examination newest first, with performer,
  origin, clinical notes, cost and paid state. Vet only.
- Edit a recorded examination, and mark one as paid from the history.
- Attach X-ray and ultrasound images: upload with client-side type and size checks, thumbnails,
  full-size viewer, delete behind a confirmation.
- `apiFetch` now leaves multipart bodies alone and `apiFetchBlob` fetches authenticated images,
  both sharing one auth-and-refresh helper.

## 2026-09-21 — Visit flow: check-in, complete, walk-in, pay

Frontend only. 75 test files, 384 tests, typecheck, lint and build clean.
([document](specs/2026-09-21-appointments-visit-flow.md))

- Check in from the detail panel: one click for a full booking, or a resolution form that picks
  or creates the owner and picks or enters the patient card for a thin one.
- Complete a visit by recording the examination (performer, anamnesis, diagnosis, therapy,
  cost), with the same resolution first when check-in was skipped; then mark it paid.
- Walk-in examinations for existing patients from a toolbar button.
- New `features/examinations` data layer and a `widgets/visit` layer that composes the
  appointments, patients and examinations features. Performer names prefill from the logged-in
  user's profile via a new `useCurrentUser` hook.

## 2026-09-21 — Frontend hardening and appointment scheduling actions

Frontend only. 62 test files, 334 tests, typecheck and lint clean.

**Hardening** ([document](specs/2026-09-21-frontend-hardening-before-scheduling.md))

- Write actions go through `useMutation` hooks that own cache invalidation; patient create,
  update and delete converted.
- Backend error codes live in per-feature catalogs (`patientErrors`, `appointmentErrors`) with
  `isApiErrorCode` and `appointmentErrorMessage` helpers.
- Appointment status transitions and the reverse enum mapping are mirrored from the backend.
- Query errors are toasted once from the query client via `meta.errorTitle`; the per-page effects
  are gone.
- `ConfirmDialog` replaces `window.confirm`. Router has an error page and a not-found route.
- Architecture test enforces the layer rules; `react-hooks/exhaustive-deps` enabled; frontend CI
  job added.

**Scheduling actions** ([document](specs/2026-09-21-appointments-scheduling-actions.md))

- Book an appointment from the toolbar or a free day-view slot, with type, surgery duration,
  owner and patient.
- Reschedule, cancel and mark no-show from the detail panel, gated by the transition table.
- "Needs closing" banner and list for scheduled appointments whose time has passed.
- Shared `Select` gained placeholder and error; new `PatientPicker` in the patients feature.

**Process**

- Features are now documented in one file each (design plus task checklist) instead of a spec and
  plan pair. `CLAUDE.md` and `docs/README.md` updated; older pairs kept as they are.
- Test timeouts raised (15 s per test, 3 s for async queries) because the full parallel run on a
  16-core machine was tripping the defaults.
