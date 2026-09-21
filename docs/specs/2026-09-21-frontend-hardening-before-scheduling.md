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
