# Appointment form: kept whole, two missing tests

Status: Implemented. Concerns the form from the
[scheduling actions](2026-09-21-appointments-scheduling-actions.md),
[client appointments](2026-09-21-client-appointments.md) and
[phone patterns](2026-10-06-phone-patterns.md) documents.

## What this adds

Nothing a user sees. The booking form gets tests for two behaviours that had none:

- A slow owner lookup for a patient chosen first cannot overwrite the owner of the patient chosen
  after it.
- Picking another day clears a finished "no free time in the next 14 days" result, so the message
  speaks about the day on screen.

Not in this document: splitting `AppointmentFormPanel` into sections and hooks, which was planned
and declined on 2026-10-07 (see Design).

## Backend contract

None. The tests stub `getAvailability` and the page's `ownerOfPatient` as the existing form tests
do.

## Design

**The form stays in one file.** A split into slot and party sections plus two hooks was planned on
2026-10-07 and declined. Its pieces share form state (the date drives the slots, the type the
duration, the patient the owner), so sections would need the form passed in as props. The total
would grow by about 40 lines, and reading the booking flow would mean opening five or six files.
The form is used in one place, changes rarely, and its 20 existing tests already drive it through
the screen. If its logic grows, moving the Next free day search and the owner lookup into hooks is
the first step, with the fields left together.

**Test what is fragile, where the existing tests live.** Both behaviours are guarded by a few lines
in `AppointmentFormPanel`: the looked-up patient ref and the effect that resets the search on a new
date. The new cases sit in the existing describe blocks and use their helpers. Each was checked by
removing its guard and watching it fail.

## Tasks

- [x] **Owner lookup race**: a held lookup for Luna answers after Rex's; the owner stays Rex's.
- [x] **Search reset on a new day**: after "No free time in the next 14 days.", picking 18.09.2026 in
      the day strip shows that day's message instead.

## Where it lives

```
frontend/src/features/appointments/components/
  AppointmentFormPanel.test.tsx   + two cases; afterEach also restores real timers
```

## Notes from implementation

- **Two clocks in these tests.** The form tests mock `Date.now`, but `clinicToday()` reads
  `new Date()`, so the day strip's earliest day is the real date and every September day in the
  fixtures is disabled. The reset test fakes `Date` itself (`vi.useFakeTimers({ toFake: ['Date'] })`,
  as the microchip and certificate store tests do) at the instant the other tests use.
- **One unexplained failure.** The first full run after adding the tests had one failure that two
  further full runs did not repeat; a one-off failure under full-suite load was seen before these
  tests existed (2026-10-06), and its test was not identified either time.
