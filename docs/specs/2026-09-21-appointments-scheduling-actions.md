# Appointments: scheduling actions (sub-project 2)

Status: Implemented. Builds on the [vet calendar](2026-09-17-appointments-vet-calendar.md)
and the [hardening pass](2026-09-21-frontend-hardening-before-scheduling.md).

## What this adds

The vet can act on the calendar instead of only reading it:

- **Book**: pick a date, a free slot, a type, optionally an owner and a patient. A surgery may be
  longer than one slot. A free slot in the day view is a shortcut into booking.
- **Reschedule** a still-scheduled appointment to another free slot.
- **Cancel** with an optional reason. **Mark no-show** with an optional note.
- **See what needs closing**: scheduled appointments whose time has passed, in a list that opens
  each one so it can be marked.

Out of scope: check-in, complete, examinations (sub-project 3), the client booking page
(sub-project 5), any backend change.

## Backend contract

All under `appointments`. Instants are UTC ISO strings, `type` is the int enum.

| Call | Body | Rules the UI respects |
|---|---|---|
| `POST appointments` | `{ ownerId?, patientId?, startsAt, durationMinutes, type, reason? }` | `startsAt` on a 30-minute boundary. Duration a multiple of 30, at most 480, exactly 30 unless surgery. A patient without an explicit owner inherits the patient's owner. |
| `POST {id}/reschedule` | `{ startsAt, durationMinutes? }` | Only while `scheduled`. Same duration rules. |
| `POST {id}/cancel` | `{ reason? }` | From `scheduled` or `checked_in`. |
| `POST {id}/no-show` | `{ note? }` | Vet only. From `scheduled`. |
| `GET unresolved` | | Vet only. `scheduled` with `startsAt` in the past. |
| `GET {id}` | | Used when the selected appointment is outside the visible range. |
| `GET availability?from&to&durationMinutes` | | Longer durations allowed for a vet; `isAvailable` means that duration can start there. |

Error codes come from `appointmentErrors`. The UI reacts to `SlotTaken`,
`PatientDoesNotBelongToOwner`, `OnlyScheduledCanBeRescheduled`, `InvalidTransition`, `NotFound`,
`Owners.NotFound`, `Patients.NotFound`; everything else gets a generic message.

## Design

**Where things live.** Features never import each other, so the form cannot use the owner picker
from the patients feature directly. `AppointmentFormPanel` takes the owner and patient pickers as
render slots and `AppointmentsPage` fills them in, like the detail panel's `patientSection`. New
in the patients feature: `PatientPicker`, a search over active patients labelled `Name · Owner`.

**Data layer.** Six API functions, two new keys (`detail(id)`, `unresolved()`), four mutation
hooks that invalidate `appointmentKeys.all` (which also refreshes availability, the unresolved
list and the dashboard tiles), `useUnresolvedAppointmentsQuery`, `useAppointmentQuery`.
`toCreateRequest` and `toRescheduleRequest` map form values to DTOs; `startsAt` is always a slot's
own value from availability, so the 30-minute rule holds by construction.

**Slot options.** `slotOptions(slots, current?)` turns a day's availability into start-time
options in clinic time. A slot is offered when free or, while rescheduling, when it overlaps the
appointment being moved, because the backend ignores that appointment in its own overlap check
but availability does not know that. The form asks availability for the chosen duration, so a
90-minute surgery only sees starts where 90 minutes fit.

**Form.** One panel with `mode: 'create' | 'reschedule'`. Create shows date, start time, type,
duration (surgery only), patient, owner, reason. Reschedule shows date, start time, duration
(surgery only) and a read-only summary of the rest. Leaving surgery resets duration to 30; a
start time that is no longer offered is cleared. `SlotTaken` marks the start-time field and
refetches availability; `PatientDoesNotBelongToOwner` marks the patient field; a missing owner or
patient clears that field with a message.

**Detail panel actions.** Reschedule, cancel and no-show buttons appear only when the page passes
the handler and the transition table allows it. No-show is also held back until the start time
has passed, a frontend-only convenience. Cancel and no-show confirm through `ConfirmDialog` with
a `Textarea` for the optional reason or note.

**Selection outside the range.** The page keeps `selectedId`; the appointment comes from the
visible list when present, otherwise from `GET appointments/{id}`. The unresolved list opens
appointments the calendar is not showing, and a reschedule that moves one out of range keeps the
panel open with the new time.

**Unresolved list.** `UnresolvedBanner` shows "N appointments need closing" with a Review button
when the count is non-zero; `UnresolvedPanel` lists date, time, party and type per row.

## Notes from implementation

- The shared `Select` gained `placeholder` and `error` props and renders the selected label
  itself. Radix left the trigger blank when the value was set before its options mounted, which
  is the preselected-slot case.
- `appointmentErrors` gained `ownerNotFound` and `patientNotFound`: the create handler returns
  those codes and the appointments feature cannot import the patients catalog.
- The render slots return a `ReactElement`, as react-hook-form's `Controller` requires; the page
  keeps a small id-to-option cache so the pickers can display the selection.
- The owner picker still reads "Owner *" although owner is optional when booking; its copy lives
  in the patients feature and was left alone.

## Tasks

- [x] Data layer: API functions, keys, mutation hooks, queries, request mapping
- [x] Slot options
- [x] `ConfirmDialog` children, `PatientPicker`
- [x] Booking: form, toolbar button, free-slot shortcut, page wiring
- [x] Reschedule
- [x] Cancel and no-show
- [x] Unresolved list and out-of-range selection

## Where it lives

```
src/features/appointments/
  api/appointmentsApi.ts            + create, reschedule, cancel, markNoShow,
                                      getUnresolved, getAppointment
  api/appointmentKeys.ts            + detail(id), unresolved()
  types.ts                          + write values, request DTOs, PartyRef
  lib/appointmentRequest.ts         form values to a create or reschedule request
  lib/slotOptions.ts                availability to start-time options
  hooks/useAppointmentMutations.ts  the four write hooks, each invalidating the feature root
  hooks/useAppointmentQuery.ts      one appointment, for a selection outside the visible range
  hooks/useUnresolvedAppointmentsQuery.ts
  components/AppointmentFormPanel.tsx    booking and rescheduling, pickers as render slots
  components/UnresolvedBanner.tsx        count and a Review button
  components/UnresolvedPanel.tsx         the list of visits needing closing
  components/AppointmentDetailPanel.tsx  + reschedule, cancel and no-show buttons
  components/CalendarToolbar.tsx         + New appointment
  components/DayView.tsx                 a free slot became a button
src/features/patients/
  components/pickers/PatientPicker.tsx   search active patients, labelled Name and owner
src/shared/ui/Select/                    + placeholder and error
src/pages/AppointmentsPage.tsx           owns the panels, the dialogs and the picker slots
```
