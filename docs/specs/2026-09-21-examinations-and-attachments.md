# Examinations and attachments (sub-project 4)

Status: Implemented. Builds on the [visit flow](2026-09-21-appointments-visit-flow.md), which creates
examinations. This sub-project lets the vet see, edit and illustrate them.

## What this adds

- **Visit history** in the patient detail panel: every examination for the patient, newest
  first, with performer, date, diagnosis, cost and paid state.
- **Edit an examination** after the fact: the same six fields as when recording it.
- **Mark as paid** from the history, not only right after recording.
- **Attachments**: upload X-ray and ultrasound images to an examination, see them as thumbnails,
  open one full size, delete one.

Out of scope: a client's view of their animal's results (the backend keeps these endpoints
vet-only on purpose), anything on the appointments page, any backend change.

## Backend contract

All vet-only.

| Call | Body | Result | Notes |
|---|---|---|---|
| `GET patients/{id}/examinations` | | `ExaminationResponse[]` | Newest first. Each item carries its `attachments`. `Patients.NotFound` for a bad id. |
| `PUT examinations/{id}` | `{ examination: ExaminationDetails }` | `204` | Same validation as recording. `Examinations.NotFound`. |
| `POST examinations/{id}/pay` | | `204` | Already used by sub-project 3. |
| `POST examinations/{id}/attachments` | multipart: `file`, `kind` (0 X-ray, 1 ultrasound) | attachment id | JPEG, PNG or WebP, non-empty, at most 20 MB. Errors `Attachments.UnsupportedContentType`, `Attachments.EmptyFile`, `Attachments.FileTooLarge`. |
| `GET attachments/{id}` | | the image bytes | Needs the bearer token like every call, so it cannot be an `<img src>`; fetch as a blob. `Attachments.NotFound`, `Attachments.ContentMissing`. |
| `DELETE examinations/{id}/attachments/{attachmentId}` | | `204` | `Attachments.NotFound`. |

`ExaminationResponse` and `AttachmentResponse` are already typed and mapped in
`features/examinations` (`Examination`, `Attachment`, `kind` as `'xray' | 'ultrasound'`).

## Design

**API client.** `apiFetch` always sets `Content-Type: application/json` and parses JSON. Two
small additions in `shared/lib/apiClient.ts`: skip the content type when the body is `FormData`
(the browser sets the multipart boundary), and `apiFetchBlob(path)` that returns a `Blob` with the
same auth and refresh handling. Nothing else in the client changes.

**Examinations feature.** `getPatientExaminations`, `updateExamination`, `uploadAttachment`,
`deleteAttachment`, `getAttachmentBlob`; hooks `usePatientExaminationsQuery(patientId)`,
`useUpdateExamination`, `useUploadAttachment`, `useDeleteAttachment`, `useAttachmentUrl(id)`.
Mutations invalidate `examinationKeys.all`. `examinationErrors` gains the five attachment codes
with plain messages ("Only JPEG, PNG and WebP images can be attached", "The file is larger than
20 MB", ...).

**Image loading.** `useAttachmentUrl(id)` fetches the blob through the query cache
(`examinationKeys.attachment(id)`, long `staleTime`), creates an object URL and revokes it when
the component unmounts or the blob changes. Thumbnails and the full-size view both use it, so an
image is downloaded once.

**Components** in `features/examinations/components/`:

- `VisitHistory({ patientId, onEdit })`: list of `ExaminationCard`s or an empty state. Loading
  and error states via `Skeleton` and the usual `meta.errorTitle`.
- `ExaminationCard`: date and time in clinic time, performer, type of origin (appointment or
  walk-in), diagnosis and therapy (clamped, expandable), cost with a `Badge` for paid or unpaid,
  "Mark as paid" when unpaid and a cost exists, "Edit", and the `AttachmentStrip`.
- `AttachmentStrip({ examinationId, attachments })`: thumbnails with a kind label, an "Add image"
  control that opens `AttachmentUploader`, delete on each thumbnail behind a `ConfirmDialog`,
  click opens `AttachmentViewer`.
- `AttachmentUploader`: file input limited to `image/jpeg, image/png, image/webp`, kind
  `Select`, client-side checks for empty and over 20 MB mirroring the backend, upload button with
  pending state, backend errors shown inline.
- `AttachmentViewer`: a `Modal` with the full-size image, file name, kind and size.
- `ExaminationEditPanel({ examination })`: `SlidePanel` with `ExaminationFields` prefilled from
  the examination, saves through `useUpdateExamination`, `Examinations.NotFound` closes with a
  toast.

**Where it plugs in.** The patients feature cannot import examinations, so `PatientDetailPanel`
gains an optional `visitsSection?: ReactNode`, rendered as a "Visits" section after the existing
ones. `PatientsPage` passes `<VisitHistory patientId onEdit />` for veterinarians only and owns
the `ExaminationEditPanel` state, the same way `AppointmentsPage` owns its panels.

**Appointments page.** No change. `AppointmentResponse` does not carry an examination id, so a
completed appointment cannot link to its examination without a backend addition; the history on
the patient panel is the entry point instead. Worth asking the backend for `examinationId` on
the response later.

**Errors.** Upload errors stay inside the uploader. Delete and pay failures toast through
`examinationErrorMessage`. A missing image (`ContentMissing`) renders the thumbnail as a broken
image placeholder with the file name, not as a page error.

## Tasks

Verification for every task, from `frontend/`: `npx vitest run`, `npx tsc -b`, `npm run lint`.
No commits; the user commits. Tests first for each task.

- [x] **1. API client.** `FormData` bodies skip the JSON content type; `apiFetchBlob`. Tests:
  multipart request has no `Content-Type` header set by us; blob call returns a `Blob` and still
  refreshes on 401.

- [x] **2. Data layer.** The five API functions, `examinationKeys.attachment(id)`, the five hooks,
  attachment error codes and messages. Tests: paths, methods and bodies (multipart fields
  `file` and `kind`), invalidation on success, object URL created and revoked in
  `useAttachmentUrl`.

- [x] **3. Visit history.** `VisitHistory`, `ExaminationCard`, `PatientDetailPanel.visitsSection`,
  `PatientsPage` wiring for veterinarians. Tests: newest first; paid and unpaid badges; "Mark as
  paid" only when unpaid with a cost; section absent for a client.

- [x] **4. Edit.** `ExaminationEditPanel` and `useUpdateExamination`, opened from a card. Tests:
  prefilled fields; `PUT` body; `Examinations.NotFound` closes with a toast; list refreshes.

- [x] **5. Attachments.** `AttachmentStrip`, `AttachmentUploader`, `AttachmentViewer`. Tests:
  client-side rejection of a wrong type and an oversized file; upload posts `file` and `kind`;
  thumbnails render from the blob URL; delete confirms then calls the route; viewer opens with
  the file name.

- [x] **6. Docs.** Flip this document to Implemented in `docs/README.md`, add the changelog entry.

## Notes from implementation

- `apiFetch` and `apiFetchBlob` now share one `requestWithAuth` helper that carries the bearer
  token, the single-flight refresh and the problem parsing. `apiFetch` lost its internal third
  parameter; no call site used it.
- Two test-environment quirks worth knowing. A `Response` cannot be constructed from a jsdom
  `Blob`, and `response.blob()` returns undici's `Blob`, which is a different class from the
  jsdom global, so `toBeInstanceOf(Blob)` fails. The tests build responses from strings and
  assert on `type` and `size` instead.
- Testing Library's `user.upload` honours the file input's `accept` attribute, so a wrong-type
  file never reaches the change handler. The client-side type guard is exercised with
  `userEvent.setup({ applyAccept: false })`, which is how a drag-drop or an "All files" pick
  behaves in a real browser.
- The patient panel now holds two kinds of Edit button, one for the record and one per visit.
  They are visually distinct, and tests scope to the visit card's `article` role.
- `attachmentKindToApi` and `examinationValuesOf` were added beside their existing counterparts,
  following the `typeToApi` and `buildDefaults` patterns.
- The attachment blob query deliberately carries no `meta.errorTitle`: a missing image shows a
  placeholder in its thumbnail rather than raising a page-level toast.

## Where it lives

```
src/shared/lib/apiClient.ts             requestWithAuth shared by apiFetch and apiFetchBlob;
                                        a FormData body keeps the browser content type
src/features/examinations/
  api/examinationsApi.ts                + getPatientExaminations, updateExamination,
                                          uploadAttachment, deleteAttachment, getAttachmentBlob
  api/examinationKeys.ts                + attachment(id)
  api/examinationErrors.ts              + the five attachment codes
  lib/examinationMapping.ts             + attachmentKindToApi
  lib/examinationDetails.ts             + examinationValuesOf, for the edit form
  lib/attachmentRules.ts                accepted types, 20 MB limit, kind labels, size format
  hooks/usePatientExaminationsQuery.ts  the visit history
  hooks/useAttachmentUrl.ts             blob through the cache, object URL revoked on unmount
  hooks/useExaminationMutations.ts      + update, upload, delete
  components/VisitHistory.tsx           the list, with loading, error and empty states
  components/ExaminationCard.tsx        one visit: notes, cost, paid badge, actions, images
  components/ExaminationEditPanel.tsx   edit a recorded visit
  components/AttachmentStrip.tsx        thumbnails, add and delete
  components/AttachmentUploader.tsx     file input, kind, client-side checks
  components/AttachmentViewer.tsx       full-size image
src/features/patients/
  components/PatientDetailPanel.tsx     + visitsSection slot
src/pages/PatientsPage.tsx              fills the slot for a vet, owns the edit panel
```
