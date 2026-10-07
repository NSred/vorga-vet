# Shared visual system: the Claude Design look on phone and desktop

Status: Implemented. Builds on the [mobile layout](2026-10-06-mobile-layout.md), the
[shared UI library](2026-08-04-kartoteka-shared-ui.md) and the
[frontend consolidation](2026-10-06-frontend-consolidation.md). The source is the Claude Design
file "VorgaVet Mobile" (15 phone screens, received 2026-10-06), analysed in the same session.
The shared-code changes are also listed in the app-wide table of the
[hardening document](2026-09-21-frontend-hardening-before-scheduling.md).

## What this adds

The whole app, on desktop and on a phone, takes on the look of the design without changing what
any screen does:

- **One typeface and one shape language.** Figtree everywhere on screen, rounder cards and
  inputs, heavier page titles, labels in normal case with a red asterisk for required fields.
- **Inputs that look alike.** Text fields, text areas, selects, searchable pickers and date
  pickers share one height, one white field, one border and one focus ring; a field can carry a
  unit such as "kg".
- **A calmer segmented control.** A grey track with a raised white tab and green text, with an
  optional count badge, used for every switch from Day/Week/Month to Active/All/Deleted.
- **Section cards.** Detail panels and forms group their content into white cards with a small
  heading, on a grey panel background, instead of rows divided by lines.
- **Panel headers that say who or what.** The patient and appointment panels open with a tinted
  header: an eyebrow line, an avatar tile, a large title, a subtitle and status chips.
- **Empty states with a face.** A dashed card with an icon tile, a title and a hint on the
  patient-card sections, reminders, the daily report, a closed day and a client's upcoming visits.
- **Page chrome.** A brand mark beside "VorgaVet", Log out as a pill, larger page titles, and the
  dashboard figures in one card with dividers.

Deliberately out of scope, for the phone-patterns document that follows: the day strip and week
agenda, the appointment status stepper, the booking slot grid, bottom action bars, the floating
New patient button and bottom sheets. Also out: counts and "+ Add" buttons in the patient card's
section headings (they need the sections to report their own data), species chips, the sex switch
and the patient-panel tiles for age, weight and sex. Print documents keep their own serif look,
and the login page only inherits the new font.

## Backend contract

No endpoint is added or changed. The design shows a few things the API cannot back, and this work
does not imitate them: a Rabbit species (the species enum is dog, cat, bird, other), the visit
types Vaccination and Control with a 15-minute duration (the backend has First visit, Checkup,
Blood draw and Surgery, all 30 minutes except surgery), sorting patients, restoring deleted
cards, and retiring breeds or allergens.

## Design

**This changes desktop on purpose.** The mobile layout kept desktop pixel-identical; this work is
the opposite. Every shared component changes for every width, because panels are 560px wide on
desktop and 390px on a phone, so the same section cards and fields read well on both. What stays
width-specific is size: controls are 40px tall on desktop and 48px on a phone, through
`--control-height`.

**Tokens first, components second.** Visual decisions are tokens in `tokens.css`, and components
read tokens rather than literal values. The palette barely moved: the tokens adopt the design's
greens, off-whites, borders and status colours, with two deliberate exceptions. Body-muted text
keeps our darker grey, because the design's measures 4.4:1 on the card colour, under the 4.5:1
small text needs; ours measures 5.2:1. The design's lighter grey became `--text-faint` for hints
and placeholders only. Input borders keep our slightly stronger colour; neither meets 3:1, and
the white field on a grey background carries the shape. Radii grew to the design's scale by
changing `--radius` and `--radius-sm` and adding `--radius-lg` and `--radius-field`, so the 60
places in 37 stylesheets that use them followed without edits.

**Figtree is bundled, not fetched.** The design loads Figtree from Google Fonts. The app runs in
Docker on a clinic network and on Render, so the font comes from `@fontsource-variable/figtree`
(SIL Open Font License) and ships with the app. One variable file covers every weight, and its
Latin Extended range covers š, đ, č, ć and ž. The system font stays as the fallback.

**Labels and the field shell.** `field.module.css` owns the label style and a `shell` class that
the five input kinds pull in through CSS Modules `composes`, so their border, radius, height,
focus ring and invalid colour live in one place. `FieldLabel` renders a trailing " *" as a red
asterisk while the accessible name stays "Vet *". Text inputs show the focus ring while typing;
select, picker and date triggers are buttons and show it only for keyboard focus, so it does not
linger after a mouse choice. `TextField` has a `suffix` for units.

**Section cards and the panel body.** `DetailSection` is the card, with an optional title, and a
`SlidePanel` body is grey and lays its children out with a flex gap, so detail sections and form
sections are spaced the same way without margins that add up. Every form panel's form sits in a
card; the patient form splits into Identity, Animal and Medical, and the visit panels put the
examination in its own card. The party-resolution boxes and the paid summary took the card look
rather than nesting.

**Panel headers.** `EntityHeader` renders the tinted hero; `SlidePanel` got a larger title and a
round filled close button. The patient panel shows the card number, a solid Active chip or a
Deleted chip, sex and allergies. The appointment panel shows the type as a chip, the time range
as the title, the date and minutes, and the status, so those left the body, which now holds the
patient first and then party, created date and reason. Appointment types reuse badge tones for
colour: blue for a first visit, green for a checkup, pink for a blood draw, orange for surgery.

**Segmented control and badges.** Only the segmented control's styles changed, plus an optional
`count` per option. Labels no longer wrap, so on a phone a switch wider than the screen scrolls
inside its track instead of breaking its labels over two lines. `Badge` gained a solid `accent`
tone for the Active chip, which disappeared in the soft green on the tinted header.

**Page chrome.** The nav pills keep the green active pill the design also uses. The brand has
the green "V" tile, Log out is a 34px pill, page titles grew, and the dashboard figures share one
card with dividers, laid out as columns so three figures fill the width.

## Tasks

- [x] **Tokens and font**: design palette with the two contrast exceptions, radius scale, control
      heights, Figtree bundled. Existing tests pass; checked by eye.
- [x] **Labels and the field shell**: sentence-case labels with a red asterisk, one shell for all
      five input kinds, `suffix` on `TextField`. Tests prove the asterisk keeps the accessible name
      and the suffix renders.
- [x] **Buttons, chips and the segmented control**: sizes from tokens, round close button,
      white-tab segmented control with optional counts. Tests prove counts render with a readable
      name and the selection is reported.
- [x] **Section cards and panels**: card `DetailSection`, grey panel body, `EntityHeader` on the
      patient and appointment panels. Tests prove the header renders what it is given.
- [x] **Forms in sections**: the patient form in three cards, every other form panel in one.
      Tests prove each patient field sits in its section.
- [x] **Empty states and page chrome**: icon and hint where they earn it, brand tile, Log out
      pill, page titles, one-card figures. Tests prove icon and hint render only when given.
- [x] **Visual check**: before-and-after screenshots of eleven screens at 1440×900 and 390×844 on
      the real API, the fixes they found, and a sideways-scroll sweep at 390 and 360px.

## Where it lives

```
frontend/
  package.json                                + @fontsource-variable/figtree
  src/main.tsx                                + font import
  src/index.css                               + Figtree first in the font stack
  src/shared/ui/tokens.css                    palette, radius scale, --field, --focus-ring,
                                              --control-height (48px on phones)
  src/shared/ui/field.module.css              label, required mark, the shared field shell
  src/shared/ui/FieldLabel/                   label with a red asterisk for " *"
  src/shared/ui/EntityHeader/                 tinted panel hero: eyebrow, avatar, title, chips
  src/shared/ui/TextField/                    + shell, suffix
  src/shared/ui/Textarea/                     + shell
  src/shared/ui/Select/, Combobox/, DatePicker/   triggers on the shell, FieldLabel
  src/shared/ui/SearchInput/SearchInput.module.css  field look, focus ring instead of glass
  src/shared/ui/Button/Button.module.css      control height, field radius, bolder text
  src/shared/ui/IconButton/                   + filled variant
  src/shared/ui/Badge/                        24px chips, + accent tone
  src/shared/ui/SegmentedControl/             white tab on a grey track, + count, phone scroll
  src/shared/ui/Details/                      section card, optional title
  src/shared/ui/SlidePanel/                   grey body with a flex gap, title, close button
  src/shared/ui/EmptyState/                   + icon and hint, dashed card
  src/shared/ui/PageHeader/PageHeader.module.css   larger titles
  src/app/layout/AppLayout.*                  + brand mark, Log out pill
  src/features/appointments/lib/appointmentLabels.ts   + typeTone
  src/features/appointments/components/AppointmentDetailPanel.tsx   EntityHeader, slimmer body
  src/features/appointments/components/CalendarToolbar.module.css   round arrows
  src/features/patients/components/PatientDetailPanel.tsx   EntityHeader with chips
  src/features/patients/components/PatientFormPanel.tsx     Identity, Animal, Medical
  src/features/{appointments,diagnoses,examinations,priceList}/components/*Panel.tsx   form in a card
  src/widgets/visit/components/                examination and patient cards, card-style boxes
  src/widgets/dashboard/components/StatCards.module.css, StatCard.tsx   one card with dividers
  empty-state call sites: VaccinationsSection, RemindersSection, VisitHistory, DueList,
  DailyReport, DayView, ClientAppointmentsPage
```

`PatientDetailPanel.module.css` and `AppointmentDetailPanel.module.css` were deleted; they only
styled the headers `EntityHeader` replaced. The visit panels' `sectionTitle` style and the phone
touch overrides on the search box, buttons and Log out were removed, because `--control-height`
now sets those sizes.

## Notes from implementation

- **Format only the files you touch.** Prettier writes LF and this checkout uses
  `core.autocrlf`, so running it over whole folders left 294 files whose only change was line
  endings, and `git status` listed them all. They were restored with `git checkout`; the real
  change is 65 files.
- **A count in a button needs a space.** "Unpaid exams" followed by a count span had the
  accessible name "Unpaid exams2". A whitespace text node before the span fixes the name and is
  not drawn inside a flex button.
- **The card number is not read-only.** The plan used it as the first read-only field, but staff
  can edit it, so it keeps the normal field look; the read-only shell style is in place for later.
- **Icon tiles on the page background.** The empty-state tile first used `--surface-2`, which is
  the page colour, so it vanished on pages; it uses `--surface-3`.
- **Two appointment-panel tests changed** on purpose: the time is now written with a spaced dash,
  and the date is asserted inside the header subtitle.
