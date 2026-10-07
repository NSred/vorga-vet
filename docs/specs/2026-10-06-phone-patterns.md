# Phone patterns: action bars, sheets, calendar, stepper and slot picker

Status: Implemented. Builds on the [shared visual system](2026-10-06-visual-system.md), the
[mobile layout](2026-10-06-mobile-layout.md), the
[scheduling actions](2026-09-21-appointments-scheduling-actions.md) and the
[visit flow](2026-09-21-appointments-visit-flow.md). The source is the Claude Design file
"VorgaVet Mobile" (received 2026-10-06), screens 1a–3e. The shared-code changes are also listed in
the app-wide table of the [hardening document](2026-09-21-frontend-hardening-before-scheduling.md).

## What this adds

A vet working from a phone gets the interaction patterns from the design, not only its look:

- **Actions within thumb reach.** A page's main actions sit in a bar at the bottom of the screen
  (Appointments: Walk-in and New appointment; Price list; Reminders; a client's Book a visit);
  Patient Records gets a floating "New patient" button.
- **Short dialogs as bottom sheets.** Confirmations and small forms rise from the bottom with a
  grab handle.
- **A day strip.** In day view, the week's seven days sit above the timeline with a dot on days
  that have visits; tapping one switches day. A red line marks the current time on today.
- **A week agenda.** The cramped seven-column grid becomes a list grouped by day.
- **A month preview.** Tapping a day in month view lists its visits under the calendar, with an
  "Open day" button.
- **A status stepper.** The appointment panel shows Scheduled → Checked in → Completed, one big
  button for the next step, and the other actions in a row beneath.
- **A slot picker.** Booking and rescheduling pick a day from a strip and a time from a grid of
  slots, with taken slots crossed out; the visit type is a set of cards.
- **Patient card headings that act.** Vaccinations, Reminders and Visits show a count and
  Vaccinations and Reminders their add button in the heading; the panel has tiles for age, weight
  and sex; the patient form picks species from chips and sex from a switch.

Not in this document: weekly totals in reports, swipe gestures, swipe-to-retire in lists,
collapsing empty time in the day timeline, dragging a sheet to dismiss, and disabling Save until a
short form is valid. "Paste a list" for breeds and allergens, list counts per tab and restoring
deleted cards need backend work first.

## Backend contract

No endpoint is added. The new controls use these calls and respect these rules.

| Call | Body | Rules the UI respects |
|---|---|---|
| `GET appointments?from&to` | | Range at most 62 days (`Appointments.RangeTooWide`). The day strip asks for the week of the shown day. |
| `GET appointments/availability?from&to&durationMinutes` | | 30-minute slots. `isAvailable` means the asked duration can start there; `isMine` marks the caller's own booking. A duration other than 30 is for a vet only. Same 62-day limit. |
| `POST appointments` | `{ ownerId?, patientId?, startsAt, durationMinutes, type, reason? }` | `startsAt` on minute 00 or 30. Duration a positive multiple of 30, at most 480, exactly 30 unless `type` is surgery (`Appointments.InvalidDuration`); only a vet books surgery (`Appointments.SurgeryRequiresVeterinarian`). Overlap gives `Appointments.SlotTaken`. |
| `POST appointments/{id}/reschedule` | `{ startsAt, durationMinutes? }` | Only while `scheduled`; same slot and duration rules. |
| `POST appointments/{id}/check-in` | `{ owner?, patient? }` | From `scheduled`. Resolution required when the booking lacks an owner or patient. |
| `POST appointments/{id}/complete` | `{ owner?, patient?, examination }` | From `scheduled` or `checked_in`. |
| `POST appointments/{id}/cancel` | `{ reason? }` | From `scheduled` or `checked_in`. |
| `POST appointments/{id}/no-show` | `{ note? }` | Vet only, from `scheduled`; the UI also waits until the start time. |

Status values: `scheduled`, `checked_in`, `completed`, `no_show`, `cancelled`. Types: `first_visit`,
`checkup`, `blood_draw`, `surgery`. A scheduled visit may go straight to completed, so the stepper
does not assume check-in always happens.

## Design

**Two kinds of pattern.** Page-level patterns are phone-only: the action bar, the floating
button, the day strip, the week agenda and the month preview change nothing above 640px. Patterns
inside panels and dialogs apply on every width, because panels are the same size on desktop and
phone: the stepper, the slot picker, the type cards, the section headings, the patient tiles and
the form choice controls. Bottom sheets are the phone form of the centred dialog.

**Action bar.** `PageHeader` takes `mobileActions`: `bar` (the default), `floating` or `inline`,
written to a `data-action-bar` attribute. The bar and floating rules live once in `index.css`,
keyed on that attribute, so the calendar toolbar's New appointment and Walk-in join the same bar
without duplicating styles. When a bar or floating button is on screen, `:root:has(...)` sets
`--action-bar-space`, which pads the page and lifts the toast viewport; no page has to remember
either. Reports uses `inline` because its only action, Print, is hidden on phones. The calendar
keeps its desktop button order and swaps it with `order` in the bar, so Walk-in sits left and the
wider New appointment right.

**Bottom sheets.** `Modal` keeps one structure and changes only on phones: anchored to the
bottom, full width, 24px top corners, a grab handle, sliding up, footer buttons in a 1:1.6 grid
with any third button on its own row. `FormDialog` and `ConfirmDialog` inherit it. The handle is
visual only.

**Day strip.** `DayStrip` shows the week of a date, Monday first, with optional dots and an
optional earliest day. On phones in day view the page asks for the week's appointments for the
dots; the query is cached by range, so moving within the week costs nothing. `DayView` draws the
current-time line on every width: today only, inside opening hours, refreshed each minute.

**Week agenda and month preview.** `WeekAgenda` replaces `WeekView` on phones, chosen by
`useMediaQuery`; it groups by clinic date, marks today, and tells an open empty day from a closed
one. `AgendaRow` is shared with the month preview and colours its edge from `typeTone`. On phones
every day of the shown month is tappable; the selection starts on today when the month holds it.
Appointments carry patient names but not species, so rows show no animal emoji.

**Stepper.** `AppointmentStepper` draws the three steps; a cancelled or no-show visit shows its
state instead. The footer's primary button is Check in for a scheduled visit and Complete visit
for a checked-in one; Complete visit stays in the secondary row for a scheduled visit beside
Reschedule, No-show and Cancel. "Patient record" became an "Open record" action in the Patient
section heading.

**Slot picker and type cards.** `SlotPicker` is a radio group of the day's slots, four across on
a phone and six on desktop, under a date picker and a `DayStrip` limited to today onward. A vet
now sees taken slots crossed out instead of not at all; a client still sees only free slots and
their own booking as "yours". The surgery duration select stays and drives availability. Next
free day still appears when nothing is free. `TypeCards` replaces the type select with four radio
cards in the type colours. Client booking uses the same panel.

**Patient card.** `DetailSection` takes `count` and `action`. Vaccinations, Reminders, Microchip
and Visits render their own section, so each can count its own data; `PatientDetailPanel` no
longer wraps those slots. The add buttons moved from under the lists into the headings as soft
"+ Add" buttons named "Add vaccination" and "Add reminder". Basic information starts with tiles
for age, weight and sex. The patient form picks species with the new shared `ChoiceChips` and sex
with `SegmentedControl`, which gained `labelledBy` and `fullWidth`.

## Tasks

- [x] **Action bar and floating button**: `PageHeader` `mobileActions`, calendar actions in the
      bar, page padding and toast offset. Tests prove the bar holds the actions and inline keeps
      them in place.
- [x] **Bottom sheets**: phone styles for `Modal`. Existing dialog tests pass unchanged.
- [x] **Day strip and now line**: strip with dots on phones, the time line on every width. Tests
      prove a tap changes the day, dots follow the week, and the line sits in the right slot.
- [x] **Week agenda and month preview**: tests prove grouping, open and closed empty days, and
      that a preview lists the day and opens it.
- [x] **Stepper and actions**: tests prove the step and primary action for every status.
- [x] **Slot picker and type cards**: tests prove free, taken and own slots, the surgery
      duration, and the booking tests run through the new controls.
- [x] **Patient card headings, tiles and form choices**: tests prove counts, actions, tiles and
      the species and sex controls.
- [x] **Phone check**: screenshots on phone and desktop against the real API as the vet and the
      client, a sideways-scroll sweep at 390 and 360px, and the fixes it found.

## Where it lives

```
frontend/src/
  index.css                                  + action bar and floating rules, --action-bar-space
  app/layout/AppLayout.module.css            + page padding for the bar
  shared/ui/PageHeader/                      + mobileActions
  shared/ui/Modal/                           + grab handle, bottom sheet on phones
  shared/ui/Toast/Toast.module.css           + lift above the bar
  shared/ui/Details/                         + count and action in the heading
  shared/ui/Button/                          + soft variant
  shared/ui/ChoiceChips/                     radio chips with a field label
  shared/ui/SegmentedControl/SegmentedControl.tsx   + labelledBy, fullWidth
  features/appointments/components/DayStrip.*       the week as seven day buttons
  features/appointments/components/AgendaRow.*      one visit as a row
  features/appointments/components/WeekAgenda.*     phone week view
  features/appointments/components/MonthView.*      + day preview on phones
  features/appointments/components/DayView.*        + current-time line
  features/appointments/components/AppointmentStepper.*   the three-step progress
  features/appointments/components/AppointmentDetailPanel.*   + stepper, next-step footer, Open record
  features/appointments/components/SlotPicker.*     slots as a radio grid
  features/appointments/components/TypeCards.*      visit types as radio cards
  features/appointments/components/AppointmentFormPanel.tsx   strip, slot grid and type cards
  features/appointments/components/CalendarToolbar.*   actions in the bar
  pages/AppointmentsPage.tsx                 + day strip, agenda on phones
  pages/PatientsPage.tsx, ReportsPage.tsx    floating and inline actions
  features/vaccinations/components/{Vaccinations,Reminders}Section.tsx   own section, heading add
  features/microchips/components/MicrochipSection.tsx   own section
  features/examinations/components/VisitHistory.tsx     own section with a count
  features/patients/components/PatientDetailPanel.*     + tiles, slots unwrapped
  features/patients/components/PatientFormPanel.tsx     species chips, sex switch
```

The bottom "+ Vaccination" and "+ Reminder" buttons and the footer "Patient record" button were
removed in favour of the heading actions.

## Notes from implementation

- **A flex child shrinks unless told.** The stepper sat in `EntityHeader`'s wrapping chip row and
  shrank to its content, running the labels together on a phone; it takes the full row now. The
  sex switch had the same problem in a half-width column, hence `fullWidth`.
- **Accessible names join without spaces.** A type card's label and hint read "Checkup30 min"
  until a whitespace node sat between them, as with the segmented control's count.
- **Global attribute rules versus module classes.** The calendar toolbar's own
  `display: contents` beat the global bar rule because module CSS loads later; the toolbar
  restates `display: flex` and the grow order on phones.
- **The microchip heading has no action.** The plan's "+ Chip no." would open the patient edit
  form, which the section cannot reach; the chip is still added through Edit.
- **The current-time line was not seen live.** The real-API check ran after clinic hours; the
  unit tests cover the line inside opening hours.
- **Migrated tests.** Fourteen booking test steps moved from the start-time and type selects to
  the grid and cards; the month shortcut tests moved to the preview; the patient form tests pick
  species from chips.
