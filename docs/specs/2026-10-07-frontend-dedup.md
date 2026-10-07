# Frontend de-duplication after the phone patterns

Status: Implemented. Follows the [phone patterns](2026-10-06-phone-patterns.md) and the
[shared visual system](2026-10-06-visual-system.md), whose commit (`30f4eee`, 2026-10-06) added
about 2,300 net lines. A review on 2026-10-07 found code repeated across that work; this document
removes it. Shared-code changes are also listed in the app-wide table of the
[hardening document](2026-09-21-frontend-hardening-before-scheduling.md).

## What this adds

Nothing new for a user. A colleague who changes a choice control, a day of visits, a panel tile, a
dropdown trigger or a colour now changes it in one place. A few screens line up with the rest of
the design along the way:

- The Peak hours overview shows its four numbers as tiles, like the patient panel.
- The month preview's heading and empty line match the week agenda, and today shows a "Today" tag.
- The day strip marks today with a pale fill, as the week and month views already do.
- Group labels (start time, type, species, sex) line up with the other field labels.
- The check-in and complete-visit panels use the same section spacing as the patient form.
- The date picker shows its red border when it has an error; a styling clash had hidden it.

Not in this document: the login page's own palette, plain white, and the report summary cards,
which keep their own type on purpose (see Design).

## Backend contract

None. No call, body or rule changes. The slot picker still shows the 30-minute slots from
`GET appointments/availability`, taken slots stay disabled, and the type cards still offer surgery
only to a vet.

## Design

**One radio group.** `RadioGroup` in `shared/ui` replaces `ChoiceChips`. It owns everything the
slot grid, the type cards and the species chips each built by hand: the field label naming a
`radiogroup`, `role="radio"` buttons with `aria-checked`, the focus ring, the error line and a
placeholder shown instead of the options (the slot picker's "Loading free times…"). Its own look is
the chips. A caller that needs another look passes a class for the group and for each option and
styles the checked option with `[aria-checked='true']`, so no caller juggles a `checked` class.
`SlotPicker` and `TypeCards` stay as components because they own their look and their naming (a
taken slot is read as "07:30, taken"). `FieldLabel` takes an `id`, so a group's label needs no
wrapper. The sex switch stays a `SegmentedControl` because the design draws it as a switch; it
takes `label` instead of `labelledBy`, and a labelled control fills its column, so `fullWidth`
goes.

**One day of visits.** `AgendaDay` in the appointments feature draws a day's heading (label, a
Today tag, a rule, the count), an empty line or the visit rows, and an optional action under them.
`WeekAgenda` draws seven; the month preview draws one with "Open day". The preview's dashed empty
box goes rather than moving into the day list, because seven dashed boxes would crowd an empty
week; the preview is now named by its date instead of "Selected day". `weekDays(date)` in
`calendarDays.ts` gives the Monday-first week once for the day strip, the week agenda and the week
grid, and the re-sorting of visits that `groupByClinicDate` already sorted goes. Appointment counts
in names use the existing `plural` helper.

**One panel tile.** `Tile` joins `Field` in `shared/ui/Details`, with a unit, the same dash for a
blank value and the same label style. The patient panel and the Peak hours overview use it. The
reports page keeps its `StatTile`: those tiles share their type with the report summary cards and
sit on the page, not in a panel, so they are a different element.

**Section cards in the visit panels.** The party fields and the paid summary use `DetailSection`,
`FieldGrid`, `Field` and the layout classes instead of rebuilding the card and its title. Both
stylesheets in `widgets/visit` go, and the new-patient rows gain the one-column phone layout of
`layout.formRow`.

**One trigger rule.** `field.module.css` gains `trigger`, composing `shell`, and the Select, the
searchable picker and the date picker compose it; the Select and picker icons push themselves to
the end. All three mark an error with the shared `shellInvalid`, as the text field and text area
already did, instead of three local invalid rules.

**Dead code.** The segmented control's count badge and the read-only field style have no caller.
The `secondary` button differed from `outline` only by a hover border; `FormDialog` and
`RetireRestoreButton` use `outline`.

**Colours.** Greys that drifted a few points from a token become that token; the design's distinct
colours get four named tokens (`--text-soft`, `--accent-line`, `--accent-muted`, `--danger-line`).
`--bg` had the same value as `--surface-2`, so it goes and the page uses `--surface-2`; that makes
it plain that a grey inset placed straight on the page disappears. White stays literal.

## Tasks

- [x] **Shared radio group**: `RadioGroup`, `FieldLabel` `id`, slot picker, type cards and species
      on it, `SegmentedControl` `label`. Tests prove the group names, the checked option, taken and
      own slots, the error, the placeholder and the sex group.
- [x] **Shared day and week helper**: `AgendaDay`, `weekDays`, `plural` for counts. Tests prove
      day order, open and closed empty days, the preview listing and opening its day, and the
      strip's names.
- [x] **Panel tile and visit sections**: `Tile` for the patient panel and Peak hours; section cards
      in the visit widget. Tests prove tile values and blanks, the party headings and the paid
      summary.
- [x] **Triggers and dead code**: one trigger rule, no read-only style, no segmented count, no
      `secondary` button. Existing tests pass; the segmented test loses its count case.
- [x] **Colour tokens**: merges, four tokens, `--bg` removed. No hex colour is left outside
      `tokens.css` except white, the black of the nav strip's fade mask and the login page's
      palette.
- [x] **Checks and visual comparison**: tests, types and lint; before-and-after screenshots of the
      touched components at 390 and 1280px, compared pixel by pixel, and the fix they found; then
      the touched screens against the real API as the vet and the client.

## Where it lives

```
frontend/src/
  index.css                                          body on --surface-2
  app/layout/AppLayout.module.css                    Log out colour from a token
  shared/ui/tokens.css                               + --text-soft, --accent-line, --accent-muted, --danger-line
  shared/ui/field.module.css                         + trigger
  shared/ui/FieldLabel/FieldLabel.tsx                + id
  shared/ui/RadioGroup/                              labelled radio group, chips by default
  shared/ui/SegmentedControl/                        + label
  shared/ui/Details/                                 + Tile
  shared/ui/{Select,Combobox,DatePicker}/            trigger composes the field trigger, errors use shellInvalid
  shared/ui/FormDialog/, RetireRestore/              outline buttons
  shared/ui/{SlidePanel,Modal,EmptyState,EntityHeader,Button}/*.module.css   colours from tokens
  features/appointments/lib/calendarDays.ts          + weekDays
  features/appointments/components/AgendaDay.*       one day of visits: heading, empty line, rows, action
  features/appointments/components/WeekAgenda.tsx    seven days
  features/appointments/components/MonthView.*       preview is one day
  features/appointments/components/DayStrip.*        today as a fill
  features/appointments/components/WeekView.tsx      weekDays
  features/appointments/components/SlotPicker.*      a radio group with slot classes
  features/appointments/components/TypeCards.*       a radio group with card classes
  features/appointments/components/AppointmentStepper.module.css   colours from tokens
  features/patients/components/PatientFormPanel.tsx  species group, labelled sex switch
  features/patients/components/PatientDetailPanel.*  shared tiles
  widgets/dashboard/components/PeakHoursPanel.*      shared tiles
  widgets/dashboard/components/StatCards.module.css  colour from a token
  widgets/visit/components/PartyResolutionFields.tsx section cards
  widgets/visit/components/PaidStep.tsx              section card with fields
```

Deleted: `shared/ui/ChoiceChips/`, `WeekAgenda.module.css`, `PartyResolutionFields.module.css`,
`VisitPanel.module.css`, the `secondary` button variant, the segmented control's `count`,
`labelledBy` and `fullWidth`, the read-only field rules, the three local trigger invalid rules and
the `--bg` token. Production code went from 685 lines removed against 472 added (213 fewer, 173 of
them CSS); tests grew by 67 lines.

## Notes from implementation

- **Composing from another stylesheet copies it.** Vite puts a copy of `field.module.css` into
  every stylesheet that composes from it, so a later copy undoes an override of a composed property
  at equal specificity. The date picker's `justify-content` override lost this way, so the shared
  trigger sets none and the icons use `margin-left: auto`. The same copies had hidden the date
  picker's red error border before this change; `shellInvalid` works because every copy declares
  it after `shell`. Override only properties the composed class does not set, or win on
  specificity.
- **A label inside a span is taller.** A group label wrapped in a `<span>` took the span's 16px
  line box and sat 3px lower than other field labels, visible as Sex beside Date of birth. Without
  the wrapper the labels line up, and the slot grid, type cards and chips move up 3px.
- **Two visual checks.** With Docker down, both trees first rendered the touched components with
  fixed data on a temporary preview page for the pixel comparison. Later on 2026-10-07 the real
  screens were checked against the API: the vet on phone and desktop, including the day strip's
  today fill and check-in for a booking without a patient, and the client's booking form on a
  phone. The price list had no retired item, so the Restore button was not seen live.
