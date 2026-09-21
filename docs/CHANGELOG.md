# Changelog

One entry per work session, newest first. Each entry links the feature document that holds the
details.

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
