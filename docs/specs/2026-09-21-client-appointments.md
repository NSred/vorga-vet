# Client appointments (sub-project 5)

Status: Planned. The last of the five appointment sub-projects. Everything so far is vet-only;
this gives a client (a pet owner with an account) their own appointments page.

## What this adds

For a logged-in client:

- **See their own appointments**, upcoming and past, with status.
- **Book a visit**: pick a date and a free 30-minute slot, a type (no surgery), optionally one
  of their animals, and a reason.
- **Reschedule or cancel** their own scheduled appointments.

Out of scope: anything that changes what the vet sees, check-in or examinations for clients,
notifications, any backend change.

## Backend contract

The same appointment endpoints as the vet uses, scoped by the backend to the caller. Instants are
UTC ISO strings, `type` the int enum.

| Call | What a client gets or may do |
|---|---|
| `GET appointments?from&to` | Only appointments they created or that belong to their linked owner. Range at most 62 days. |
| `GET appointments/availability?from&to` | Every clinic slot with `isAvailable`; `isMine` is true where the caller's own booking sits. `durationMinutes` other than 30 is refused. |
| `POST appointments` | `type` must not be surgery (`Appointments.SurgeryRequiresVeterinarian`), `durationMinutes` must be 30 (`Appointments.InvalidDuration`). `ownerId` in the body is ignored: the owner is the caller's linked owner or null. `patientId`, if given, must belong to that owner (`Appointments.PatientDoesNotBelongToOwner`). |
| `POST appointments/{id}/reschedule` | Own appointments only; anyone else's reads as `Appointments.NotFound`. Duration stays 30. |
| `POST appointments/{id}/cancel` | Own appointments only, same `NotFound` rule. |
| `GET patients` | Only the patients of the caller's linked owner; empty when unlinked. |

Not available to clients: no-show, check-in, complete, the unresolved list, `durationMinutes`.

**Linked and unlinked clients.** `Owner.LinkToUser` exists but nothing in the backend calls it
yet, so today every client is unlinked: `GET patients` returns nothing, and a booking is a thin
one with no owner and no patient. The vet resolves it at check-in, which is the flow the backend
built for self-registered clients. The page has to work in both states: with patients it offers
a picker, without patients it says the clinic will match the booking to the animal at the visit.
When the backend starts linking users to owners, nothing on this page changes.

## Design

**Routing.** `/appointments` stays one route. `routes.tsx` replaces the `RoleRoute` wrapper with
an `AppointmentsRoute` element that renders `AppointmentsPage` for a veterinarian and
`ClientAppointmentsPage` for a client. `AppLayout` shows the "Appointments" link to both roles.
The `RoleRoute` component stays for future vet-only routes.

**Page.** `pages/ClientAppointmentsPage.tsx`, composed from existing features:

- **Upcoming**: `useAppointmentsQuery` over `[clinicToday, +62 days)`, filtered to
  `scheduled` and `checked_in`, sorted by start. Each row shows date, time, type, patient if any,
  status, and "Reschedule" and "Cancel" while `canReschedule` / `canTransition(status,
  'cancelled')` allow it.
- **Past**: a second query over `[today − 62 days, today)`, everything else, newest first, with
  the status badge. Cancelled and no-show are shown here too; there is no toggle.
- **Book a visit**: primary button opening the booking form.
- Empty states for both lists; the upcoming one carries the booking button.

**Booking form.** `AppointmentFormPanel` gains a `variant: 'vet' | 'client'` prop (default
`'vet'`). In the client variant: the type select has no surgery option, the duration select is
never shown and 30 is sent, the owner slot is not rendered, and the patient slot is rendered only
when the page passes one. The page passes a patient slot backed by `usePatientsQuery` for the
client's own animals when that list is non-empty; otherwise it renders a short note in its place:
"The clinic will match this booking to your animal when you arrive." Reschedule reuses the same
panel in reschedule mode; the availability request never carries a duration.

**Availability display.** Slots where `isMine` is true are shown in the start-time list as
"07:30 · yours" and disabled, so a client sees their own booking without the form pretending the
slot is free. `slotOptions` gets an `isMine` flag in its output for this; the vet variant ignores
it.

**Actions.** Cancel goes through the existing `useCancelAppointment` and a `ConfirmDialog` with
an optional reason, the same copy as the vet page minus the no-show variant. Error toasts use
`appointmentErrorMessage`; `Appointments.NotFound` on an own appointment means it was removed
underneath and simply refreshes the list.

**Dashboard.** `PatientsPage` already hides the vet tiles for a client; nothing changes there.

**Copy.** Client-facing text avoids clinic jargon: "visit" instead of "appointment" in headings,
"your animals" instead of "patients". Status labels stay the shared ones.

## Tasks

Verification for every task, from `frontend/`: `npx vitest run`, `npx tsc -b`, `npm run lint`.
No commits; the user commits. Tests first for each task.

- [ ] **1. Routing.** `AppointmentsRoute` choosing the page by role; nav link for both roles.
  Tests: vet sees the calendar, client sees the client page, unauthenticated still redirects.

- [ ] **2. Form variant.** `AppointmentFormPanel` `variant: 'client'`; `slotOptions` `isMine`
  output. Tests: no surgery option, no duration select, owner slot absent, patient slot optional,
  `durationMinutes: 30` and no availability duration sent; own slot shown disabled with "yours".

- [ ] **3. Lists.** `ClientAppointmentsPage` with upcoming and past lists over two ranges.
  Tests: ranges requested, split by status, sort order, empty states, actions gated by status.

- [ ] **4. Booking.** Booking button and panel; patient slot only when the client has patients,
  the note otherwise. Tests: thin booking posts without owner or patient; with patients the
  picker appears and the id is sent; toast and refresh on success.

- [ ] **5. Reschedule and cancel.** Reuse of the reschedule mode and the cancel dialog. Tests:
  reschedule posts the new time only; cancel posts the reason; `NotFound` refreshes quietly.

- [ ] **6. Docs.** Flip this document to Implemented in `docs/README.md`, add the changelog entry.
