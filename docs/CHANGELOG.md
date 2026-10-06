# Changelog

One entry per work session, newest first. Each entry links the feature document that holds the
details.

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
