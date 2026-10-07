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
The rows from the nav-label row to the `widgets/reports/` row come from the legacy-gap work that
started on 2026-10-04, the rows from `shared/lib/mockStore.ts` onward from the consolidation of
2026-10-06, the rows from `useMediaQuery` onward from the mobile layout of the same day, the rows from
the field shell onward from the shared visual system, and the rows from `PageHeader` onward from
the phone patterns.

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
| `AppLayout` keeps nav labels on one line and truncates the email | a third link, Price list, made the header wrap and overlap at about 800 px | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `shared/lib/money.ts` with `formatPrice` and `MAX_AMOUNT` | the price list, the exam card and the paid step all show `2.500,00 RSD` and share the numeric(10,2) limit | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `ExaminationFields` takes `control` and `renderDiagnosis`, and `ExaminationEditPanel` passes `renderDiagnosis`; the Diagnosis text area is gone | the examinations feature may not import diagnoses, so pages and widgets supply the picker | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `CostSlot.commit` takes an `ExaminationRef` (id, patient, start) instead of the id | recording a vaccination needs the exam's patient and date, which the charges alone never did | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `PatientDetailPanel` gained `vaccinationsSection` and `remindersSection` | the patients feature may not import vaccinations, so the page fills the slots | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `index.css` gained `.print-root` and `@media print` rules for an A4 page | printing shows only the print container, hiding the app and its dialogs; any later document can use the same container | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `PrintPortal` moved from the vaccinations feature to `shared/ui` | the microchip registration sheet prints through the same container, and features may not import each other | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `useEntitySearch` and `usePagedEntitySearch` in `shared/lib`; `Combobox` gained `onOpen`, `hasMore`, `isLoadingMore`, `onLoadMore` | dropdowns fetch only when opened, and the patient, price list and diagnosis dropdowns page on scroll instead of stopping at the first page | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `PrintIcon`, `formatAmount`, `telHref`, `Table` column `align`, `DatePicker` `formatValue` | the reports page shows a print icon, amounts with a smaller currency, phone links, right-aligned money and the weekday in the day picker | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `SegmentedControl` is as wide as its tabs and re-measures its highlight when a tab resizes | the border ran to the page edge on the Reminders page, and the highlight kept a width measured before the web font loaded | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `AppLayout` nav scrolls sideways inside the header and keeps the active link in view | a fifth vet link, Reports, made the page scroll sideways at about 800 px | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `widgets/reports/` layer added | the reports join patients, their exams and the price list's charges, which no feature may do | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `shared/lib/mockStore.ts`, `mockApi.ts`, `validation.ts` | six mock stores repeated the same local-storage plumbing and checks | [consolidation](2026-10-06-frontend-consolidation.md) |
| `Page<T>` and `mapPage` in `shared/domain/page.ts`; `shared/lib/listParams.ts` | seven page interfaces and three URL-param parsers were the same code | [consolidation](2026-10-06-frontend-consolidation.md) |
| `shared/domain/catalog.ts` | diagnoses and the price list share the status, filters and query shape of a retirable list | [consolidation](2026-10-06-frontend-consolidation.md) |
| `PagedTable`, `FormDialog`, `Details` (`DetailSection`, `FieldGrid`, `Field`) and `RetireRestore` in `shared/ui` | tables, dialogs, detail sections and retire/restore were rebuilt per feature | [consolidation](2026-10-06-frontend-consolidation.md) |
| `SlidePanel` takes `title`, `subtitle`, `badge`; the `warn` header tone is gone | ten panels drew their own title, and nothing used `warn` | [consolidation](2026-10-06-frontend-consolidation.md) |
| `layout.module.css` and `field.module.css` in `shared/ui`, exported as `layout` and `fieldStyles` | the same layout and input-label rules were copied into up to fourteen modules | [consolidation](2026-10-06-frontend-consolidation.md) |
| `apiErrorMessage` in `apiClient`; `textRule` in `shared/lib/formRules.ts`; `plural` in `shared/lib/text.ts` | six error-message helpers and many form rules were copies | [consolidation](2026-10-06-frontend-consolidation.md) |
| `clinicTime` gained `WEEKDAYS`, `MONDAY_FIRST_WEEKDAYS`, `clinicWeekday`, `weekdayName` | three places computed weekday names their own way | [consolidation](2026-10-06-frontend-consolidation.md) |
| `shared/ui` exports components only, plus `layout` and `fieldStyles`; `Spinner` removed | no caller used the props types or the spinner | [consolidation](2026-10-06-frontend-consolidation.md) |
| `widgets/patientCard/` layer added; `usePartyFields` in `widgets/visit` | the patient card needs four features, and both appointment pages built the same pickers | [consolidation](2026-10-06-frontend-consolidation.md) |
| `Select` content capped at the available height; `Combobox` popover is `modal` | the Radix scroll lock cancelled the wheel on long Select lists and on Combobox lists inside dialogs | [dropdown wheel scroll](2026-10-06-dropdown-wheel-scroll.md) |
| `PatientDetailPanel` gained `microchipSection` | the page composes the microchips and vaccinations features into it | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `ExaminationFields` takes `costSection`, `ExaminationEditPanel` takes `costSlot`, `VisitHistory` takes `renderCharges`; the Cost field and `parseCost` are gone | the examinations feature may not import the price list, so pages and widgets fill the slots | [legacy-gap features](2026-10-05-legacy-features-frontend.md) |
| `useMediaQuery` and `PHONE_QUERY` in `shared/lib` | the calendar opens in day view on a phone, which CSS alone cannot choose | [mobile layout](2026-10-06-mobile-layout.md) |
| `Table` wraps itself in a scroller, and columns take `mobile: title, detail or hidden` | wide tables pushed the whole page sideways on phones; declared columns turn rows into cards there | [mobile layout](2026-10-06-mobile-layout.md) |
| `SlidePanel`, `Modal`, `Toast`, `Pagination`, `SearchInput`, `SegmentedControl`, `RecordList`, `Button`, `IconButton` gained phone rules; `tokens.css` gained `--touch-target` | panels fill a phone screen and controls reach 44px on touch phones, with desktop unchanged | [mobile layout](2026-10-06-mobile-layout.md) |
| `layout.module.css` gained `hideOnPhone`, phone toolbars and a one-column `formRow` under 22.5rem | print buttons are desktop-only, and filters and forms fit a narrow screen | [mobile layout](2026-10-06-mobile-layout.md) |
| `AppLayout` header becomes two rows on phones, and its nav has `aria-label="Main"` | all tabs stay reachable in a swipeable strip under the brand | [mobile layout](2026-10-06-mobile-layout.md) |
| `field.module.css` gained a shared `shell` and `required` mark; `FieldLabel` added; text field, text area, select, picker and date triggers compose the shell | one border, radius, height and focus ring for every input, and a red asterisk without changing accessible names | [visual system](2026-10-06-visual-system.md) |
| `tokens.css` adopted the design palette and gained `--radius-lg`, `--radius-field`, `--field`, `--focus-ring`, `--control-height`; Figtree bundled | the Claude Design look on every width, with our darker grey kept for contrast | [visual system](2026-10-06-visual-system.md) |
| `DetailSection` became a card with an optional title; `SlidePanel` body is grey with a flex gap; `EntityHeader` added | panels and forms group content into section cards, and entity panels open with a tinted hero | [visual system](2026-10-06-visual-system.md) |
| `SegmentedControl` options take `count`; `Badge` gained `accent`; `IconButton` gained `filled`; `EmptyState` takes `icon` and `hint`; `TextField` takes `suffix` | counts on switches, a solid status chip, the round close button, richer empty states, units on fields | [visual system](2026-10-06-visual-system.md) |
| `PageHeader` takes `mobileActions`; `index.css` styles `[data-action-bar]` and sets `--action-bar-space`; `AppLayout` and `Toast` read it | main actions sit in a bottom bar or a floating button on phones, and the page and toasts make room automatically | [phone patterns](2026-10-06-phone-patterns.md) |
| `Modal` becomes a bottom sheet with a grab handle on phones | every confirm and form dialog rises from the bottom on a phone | [phone patterns](2026-10-06-phone-patterns.md) |
| `DetailSection` takes `count` and `action`; `Button` gained `soft`; `ChoiceChips` added; `SegmentedControl` takes `labelledBy` and `fullWidth` | section headings count and act, and forms pick from chips and a labelled switch | [phone patterns](2026-10-06-phone-patterns.md) |
| `RadioGroup` replaced `ChoiceChips`; `FieldLabel` takes `id`; `SegmentedControl` takes `label` in place of `labelledBy` and `fullWidth`, and lost `count` | the slot grid, type cards and chips built the same labelled radio group three times, and no caller used the count | [de-duplication](2026-10-07-frontend-dedup.md) |
| `Details` gained `Tile` | the patient panel and Peak hours each drew their own label-over-value tile | [de-duplication](2026-10-07-frontend-dedup.md) |
| `field.module.css` gained `trigger` and lost the read-only rules; Select, Combobox and DatePicker mark errors with `shellInvalid`; `Button` lost `secondary` | three triggers repeated one rule and three invalid rules, and a composed copy hid the date picker's error border; `secondary` matched `outline` | [de-duplication](2026-10-07-frontend-dedup.md) |
| `tokens.css` gained `--text-soft`, `--accent-line`, `--accent-muted`, `--danger-line` and lost `--bg` | a dozen colours were hard-coded, and `--bg` equalled `--surface-2` | [de-duplication](2026-10-07-frontend-dedup.md) |
