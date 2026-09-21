# Changelog

One entry per work session, newest first. Each entry links the feature document that holds the
details.

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
