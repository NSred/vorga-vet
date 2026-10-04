# Frontend hardening before scheduling actions

Status: Implemented. Groundwork so that the appointment write actions (sub-project 2) copy good
patterns instead of inventing them. No new user-visible behaviour except where noted.

## Why

A review of the frontend found that the patterns the write actions would copy were the weakest
part of the code: no `useMutation` anywhere, backend error codes as string literals in components,
the appointment status rules living only on the backend, the selected appointment kept as a
snapshot, one error toast effect per page, `window.confirm` for confirmations, no router error
page, layer rules enforced by convention only, and no frontend CI.

## What changed

| Area | Before | After |
|---|---|---|
| Writes | API calls in components with manual cache invalidation | `useCreatePatient`, `useUpdatePatient`, `useDeletePatient` own invalidation of `patientKeys.all`; call sites own toasts and error mapping |
| Error codes | literals like `'Patients.NotFound'` in components | `patientErrors` and `appointmentErrors` catalogs mirroring the backend `*Errors.cs`, plus `isApiErrorCode(error, ...codes)` and `appointmentErrorMessage(error, fallback)` |
| Status rules | backend only | `appointmentTransitions.ts` mirrors `AppointmentStatusTransitions.cs`; tests list every pair |
| Enum mapping | API to domain only | `typeToApi` added, derived from the same table as `typeFromApi` |
| Selection | whole `Appointment` in page state | `selectedId`, appointment derived from query data, so the panel reflects refetches |
| Availability | fixed 30-minute slots | `getAvailability(range, durationMinutes?)`, key includes the duration (default 30) |
| Query errors | `useEffect` toast per page | `createQueryClient` toasts once per failed fetch from `meta.errorTitle`; `App` is `ToastProvider > QueryProvider > AuthProvider > Router` |
| Availability failure | blocked the calendar | calendar renders, day view says "Opening hours unavailable", separate toast title |
| Confirmations | `window.confirm` | `ConfirmDialog` on top of `Modal`, used for delete and discard |
| Router | no error handling | `errorElement` on both route groups, `*` route to `NotFoundPage` |
| Layering | convention | `src/test/architecture.test.ts` fails on upward or cross-feature imports |
| Lint | 3 rules | plus `react-hooks/exhaustive-deps`; `AuthContext` callbacks memoized, dead disable comment removed |
| CI | backend only | `frontend` job: `npm ci`, `tsc -b`, lint, vitest, build |

## Decisions worth remembering

- **Hooks invalidate, call sites react.** A failed write always has a local reaction (field error,
  inline message, toast with context), so there is no global mutation error handler.
- **Wrap `mutationFn`.** TanStack passes a context object as the second argument, so
  `mutationFn: deletePatient` would forward it into the API call.
- **One toast per failed fetch.** `QueryCache.onError` fires once per fetch, not per observer.
  Availability got its own title because two queries with the same title produced two toasts.
- **Backend `detail` text is never shown.** It names enum members and ids; the catalog maps the
  codes a user can act on to plain sentences and falls back to a generic one.
- **Test timeouts.** With one jsdom worker per core, typing-heavy tests ran three to four times
  slower than in isolation and tripped the defaults. `testTimeout` is 15 s and Testing Library's
  `asyncUtilTimeout` is 3 s.

## Left for later

Generated DTO types from Swagger, MSW for page tests, a Playwright smoke test, `refetchInterval`
on appointment lists, page-level code splitting, a shared `DayCell` for week and month views,
reading the clinic timezone from the backend, a richer lint set.

## Tasks

- [x] Central query error toasts
- [x] Error catalogs and `isApiErrorCode`
- [x] Patient mutation hooks
- [x] `ConfirmDialog`, `window.confirm` removed
- [x] Status transitions and `typeToApi`
- [x] Availability duration
- [x] Selection by id, availability degradation
- [x] Router error handling
- [x] Lint rule
- [x] Architecture test
- [x] Frontend CI job

## Where it lives

```
frontend/
  .oxlintrc.json                      + react-hooks/exhaustive-deps
  vite.config.ts                      testTimeout raised for the parallel run
  src/app/
    queryClient.ts                    createQueryClient, shouldRetry, queryMeta typing
    QueryProvider.tsx                 builds the client and wires the error toast
    App.tsx                           provider order: Toast > Query > Auth > Router
    routes.tsx                        errorElement on both groups, catch-all route
  src/pages/
    RouteErrorPage.tsx                thrown-route page
    NotFoundPage.tsx                  unknown-path page
    PatientsPage.tsx                  delete via mutation + ConfirmDialog, no error effect
    AppointmentsPage.tsx              selection by id, availability failure degrades
  src/shared/
    lib/apiClient.ts                  + isApiErrorCode
    ui/ConfirmDialog/                 confirmation dialog on top of Modal
    ui/SegmentedControl/              dead lint suppression removed
  src/features/appointments/
    api/appointmentErrors.ts          backend error-code catalog + message mapping
    api/appointmentKeys.ts            availability key carries the duration
    api/appointmentsApi.ts            getAvailability takes durationMinutes
    lib/appointmentTransitions.ts     mirror of AppointmentStatusTransitions.cs
    lib/appointmentMapping.ts         + typeToApi
    hooks/useAppointmentsQuery.ts     + meta.errorTitle
    hooks/useAvailabilityQuery.ts     + meta.errorTitle, options object
    components/DayView.tsx            "Opening hours unavailable" heading
  src/features/patients/
    api/patientErrors.ts              backend error-code catalog
    hooks/usePatientMutations.ts      create, update, delete; own the invalidation
    hooks/usePatientQuery.ts          + meta.errorTitle
    hooks/usePatientsQuery.ts         + meta.errorTitle
    components/PatientFormPanel.tsx   mutations, catalog codes, discard dialog
  src/features/auth/context/AuthContext.tsx   callbacks memoized for the deps rule
  src/test/
    architecture.test.ts              fails on upward or cross-feature imports
    renderWithQuery.tsx               test client built the same way as the app's
    setup.ts                          asyncUtilTimeout raised
.github/workflows/build.yml           frontend job: install, typecheck, lint, test, build
```

## Shared code touched by the sub-projects that followed

This pass was the dedicated clean-up, but four later sub-projects each changed shared code too.
Together with the list above, this is the whole set of app-wide changes in the appointments arc.

| Change | Why | Where it is explained |
|---|---|---|
| `Select` gained `placeholder` and `error`, and renders the selected label itself | Radix left the trigger blank when a value was set before its options mounted | [scheduling actions](2026-09-21-appointments-scheduling-actions.md) |
| `PatientPicker` added to the patients feature | booking needs to search patients, and the appointments feature may not import patients | [scheduling actions](2026-09-21-appointments-scheduling-actions.md) |
| `shared/domain/examinationDetails.ts` added | the appointments and examinations features both send this payload and may not import each other | [visit flow](2026-09-21-appointments-visit-flow.md) |
| `widgets/visit/` layer added | the visit panels need both the patients and appointments features, which a feature may not do | [visit flow](2026-09-21-appointments-visit-flow.md) |
| `useCurrentUser` added to the auth feature | the examination form prefills who performed the visit from the logged-in user | [visit flow](2026-09-21-appointments-visit-flow.md) |
| `apiClient` split into `requestWithAuth`, with `apiFetchBlob` beside `apiFetch` | multipart uploads must not carry a JSON content type, and authenticated images need the same refresh handling | [examinations and attachments](2026-09-21-examinations-and-attachments.md) |
| `PatientDetailPanel` gained `visitsSection` | the patients feature may not import examinations, so the page fills the slot | [examinations and attachments](2026-09-21-examinations-and-attachments.md) |
| `Select` gained per-option `disabled` | a client's own slot is shown as unselectable rather than as a gap | [client appointments](2026-09-21-client-appointments.md) |
| `clinicTime` gained `clinicUpcomingDaysRange` | the client page needs a forward window, the mirror of the existing backward one | [client appointments](2026-09-21-client-appointments.md) |
| `AppLayout` shows the Appointments link to both roles | clients now have their own page at the same route | [client appointments](2026-09-21-client-appointments.md) |
