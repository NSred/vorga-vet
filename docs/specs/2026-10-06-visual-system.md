# Shared visual system: the Claude Design look on phone and desktop

Status: Planned. Builds on the [mobile layout](2026-10-06-mobile-layout.md), the
[shared UI library](2026-08-04-kartoteka-shared-ui.md) and the
[frontend consolidation](2026-10-06-frontend-consolidation.md). The source is the Claude Design
file "VorgaVet Mobile" (15 phone screens, received 2026-10-06), analysed in the same session.
Shared-code changes go into the app-wide table of the
[hardening document](2026-09-21-frontend-hardening-before-scheduling.md) when this closes.

## What this adds

The whole app, on desktop and on a phone, takes on the look of the design without changing what
any screen does:

- **One typeface and one shape language.** Figtree everywhere on screen, rounder cards and
  inputs, heavier page titles, labels in normal case with a red asterisk for required fields.
- **Inputs that look alike.** Text fields, text areas, selects, searchable pickers and date
  pickers share one height, one white field, one border and one focus ring; a read-only field
  looks read-only; a field can carry a unit such as "kg".
- **A calmer segmented control.** A grey track with a raised white tab and green text, with an
  optional count badge, used for every switch from Day/Week/Month to Active/All/Deleted.
- **Section cards.** Detail panels and the longer forms group their content into white cards with
  a small heading, on a grey panel background, instead of rows divided by lines.
- **Panel headers that say who or what.** The patient and appointment panels open with a tinted
  header: an avatar tile, an eyebrow line, a large title, a subtitle and status chips.
- **Empty states with a face.** A dashed card with an icon tile, a title and a hint, optionally a
  button, wherever a list can be empty.
- **Page chrome.** A brand mark beside "VorgaVet", Log out as a pill, larger page titles, and the
  three dashboard figures in one card with dividers.

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
width-specific is only size: controls are 40px tall on desktop and 48px on a phone, where the
mobile layout's touch rules already live.

**Tokens first, components second.** Almost every visual decision becomes a token in
`tokens.css`, and components read tokens rather than literal values. The palette barely moves:
the design's green, off-whites, borders and status colours are a few points from ours, so the
tokens adopt the design's values except where contrast says otherwise. Two exceptions are
deliberate. Body-muted text keeps our darker grey, because the design's measures 4.4:1 on the
card colour, under the 4.5:1 small text needs; ours measures 5.2:1. The design's lighter grey
becomes `--text-faint` for hints and placeholders only. Input borders keep our slightly stronger
border colour; neither meets 3:1, and the white field on a grey background carries the shape.
Radii grow to the design's scale (cards 18px, fields 12px, small chips 8px, pills fully round)
by changing the existing `--radius` and `--radius-sm` values and adding `--radius-lg`, so the 60
places in 37 stylesheets that use them follow without edits.

**Figtree is bundled, not fetched.** The design loads Figtree from Google Fonts. The app runs in
Docker on a clinic network and on Render, so the font comes from the
`@fontsource-variable/figtree` package (SIL Open Font License) and is served with the app. One
variable file covers every weight the design uses, and its Latin Extended range covers š, đ, č,
ć and ž for Serbian names. The system font stays in the stack as the fallback.

**Labels.** `field.module.css` owns the label style for every input, so one change moves all of
them to sentence case at 13px semibold. A trailing " *" in a label renders as a red asterisk
through a small shared label component; the accessible name stays "Vet *", so tests that find
fields by label keep working.

**One field shell.** Text field, text area, select trigger, picker trigger and date-picker
trigger each style their own border and focus today, with small differences (some transparent,
some white; two radii). They all move onto one shared field-shell class in `field.module.css`:
white background, field radius, control height, 1.5px accent border and a 4px soft ring on focus,
danger border when invalid, and a muted grey fill for read-only. `TextField` gains an optional
`suffix` for units. The pop-over lists keep their glass, with the new radius.

**Section cards replace divider sections.** `DetailSection` becomes the card: white, 18px radius,
a small uppercase heading in muted grey, padding 16px. A `SlidePanel` body turns grey so the cards
stand out. The same card groups forms: the patient form becomes Identity, Animal and Medical; the
other form panels get one untitled card, so no panel shows bare fields on grey. Centred dialogs
stay white and unchanged in structure; they are short.

**Panel headers.** `SlidePanel` gets the design's title size and a round, filled close button.
A new shared `EntityHeader` renders the tinted hero: avatar tile, eyebrow, title, subtitle and a
row of chips. The patient panel uses it with the card number as eyebrow and Active or Deleted,
sex and allergy chips; the appointment panel uses it with the type as a chip and the time as the
title. Both already pass a custom `header`, so nothing about how panels open changes.

**Empty states.** `EmptyState` keeps its `message` and `action` and gains an optional `icon` and
`hint`. With an icon it draws the dashed card with an icon tile; without one it looks like today,
so the seventeen existing uses change only where a screen is worth the richer version: patient-card
sections, reminders, reports and the calendar's empty day.

**Segmented control.** Only its styles change, plus an optional `count` per option shown as a
small badge. The sliding thumb keeps its measured position and its resize observer; it becomes
white with a soft shadow on a grey track, and the active label turns green.

**Page chrome.** The nav pills keep the green active pill the design also uses. The brand gets the
green "V" tile and Log out becomes a pill button. `PageHeader` titles grow to the design's weight
and size. The dashboard figures become one card with dividers instead of three cards.

**What tests can prove.** Most of this is styling, checked by eye on desktop and on a phone, with
before-and-after screenshots of the main screens. Unit tests cover the new behaviour: the label
renders a red asterisk and keeps its accessible name, `TextField` shows a suffix, the segmented
control shows counts, `EmptyState` renders icon and hint only when given, `DetailSection` and
`EntityHeader` render what they are given, and the patient form's sections hold the right fields.
Existing tests must pass unchanged.

## Tasks

- [ ] **Tokens and font**: design palette with the two contrast exceptions, radius scale, control
      heights, Figtree bundled. Existing tests pass; the change is checked by eye.
- [ ] **Labels and the field shell**: sentence-case labels with a red asterisk, one shell for all
      five input kinds, read-only look, `suffix` on `TextField`. Tests prove the asterisk keeps the
      accessible name and the suffix renders.
- [ ] **Buttons, chips and the segmented control**: button and badge sizes from tokens, round
      close button, white-thumb segmented control with optional counts. Tests prove counts render
      and the thumb still follows the selected option.
- [ ] **Section cards and panels**: card-style `DetailSection`, grey panel body, panel title and
      close button, `EntityHeader` on the patient and appointment panels. Tests prove the header
      shows eyebrow, title and chips, and existing panel tests pass.
- [ ] **Forms in sections**: the patient form in Identity, Animal and Medical; the other form
      panels in one card each. Tests prove each patient field sits in its section.
- [ ] **Empty states and page chrome**: icon and hint on `EmptyState` where it earns them, brand
      tile, Log out pill, page titles, one-card dashboard figures. Tests prove icon and hint render
      only when given.
- [ ] **Visual check and close**: before-and-after screenshots on desktop at 1440×900 and on a
      phone at 390×844 for every page and panel, fixes from the check, document closed.

## Execution detail — delete when closing

### Starting point

The mobile-layout work is uncommitted on `feature/mobile-layout`. Start once it is committed,
on a new branch from it, for example `feature/visual-system`.

### Task 1 — tokens and font

Files: `src/shared/ui/tokens.css`, `src/index.css`, `package.json`, `src/main.tsx`.

- `npm install @fontsource-variable/figtree` in `frontend/`; `import '@fontsource-variable/figtree'`
  at the top of `main.tsx`.
- `body { font-family: 'Figtree Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }`.
- Token values, design → token:

| Token | Today | New | Note |
|---|---|---|---|
| `--bg` | `#f4f2ed` | `#f3f1ec` | page and panel body |
| `--surface` | `#fffdfa` | `#fdfcf9` | cards |
| `--surface-2` | `#f7f5f0` | `#f3f1ec` | read-only fields, info tiles |
| `--surface-3` | `#efebe3` | `#e9e5dc` | segmented track |
| `--border` | `#e4e0d7` | `#e6e1d8` | card borders |
| `--border-strong` | `#d4cfc4` | unchanged | input borders, contrast |
| `--text` | `#1b1a17` | `#1d1b18` | |
| `--text-muted` | `#6f6a61` | unchanged | 5.2:1 on surface |
| `--text-faint` | `#a39d92` | `#8f877b` | hints, placeholders |
| `--accent` | `#2f6f52` | `#2e7353` | 5.7:1 with white text |
| `--accent-strong` | `#24553f` | `#225a40` | |
| `--accent-soft` | `#e5eee8` | `#e8f0eb` | focus ring uses `#e3eee7` |
| `--male` / `-soft` | `#45699c` / `#e9eef5` | `#3d679b` / `#e5edf6` | |
| `--female` / `-soft` | `#9d5378` / `#f5e9ef` | `#9c4a6d` / `#f6e6ee` | |
| `--warn` / `-soft` | `#ad6f39` / `#f6ece0` | `#b0602c` / `#f7e8dc` | |
| `--danger` | `#a63f2e` | `#a8382f` | required asterisk |
| `--radius` | `10px` | `14px` | |
| `--radius-sm` | `7px` | `10px` | |
| `--radius-lg` | new | `18px` | section cards |
| `--radius-field` | new | `12px` | field shell |
| `--control-height` | new | `2.5rem`; `3rem` under 40rem | inputs and buttons |

### Task 2 — labels and the field shell

Files: `src/shared/ui/field.module.css`, new `src/shared/ui/FieldLabel/FieldLabel.tsx` (+ test),
`TextField`, `Textarea`, `Select`, `Combobox`, `DatePicker` (tsx and css).

- `.label`: `font-size: 0.8125rem; font-weight: 600; color: var(--text); text-transform: none; letter-spacing: 0`.
- `FieldLabel({ text, htmlFor })`: if `text.endsWith(' *')` render `text.slice(0, -2)`, a space,
  and `<span className={styles.required}>*</span>`; `.required { color: var(--danger) }`.
- `.shell` in `field.module.css`: `min-height: var(--control-height); border: 1px solid var(--border-strong); border-radius: var(--radius-field); background: #fff;`
  focus or `[data-state='open']`: `border: 1.5px solid var(--accent); box-shadow: 0 0 0 4px #e3eee7;`
  `.shellInvalid`, `.shellReadOnly { background: var(--surface-2); color: var(--text-muted) }`.
- Remove the per-component hover glass on triggers; keep it on pop-over content.
- `TextField` `suffix?: string`: wrap input and suffix in the shell, suffix muted 13px semibold.
- Read-only: the patient form's card number field is the first user.

### Task 3 — buttons, chips, segmented control

Files: `Button.module.css`, `IconButton.tsx` and css (variant `filled`), `Badge.module.css`,
`SegmentedControl.tsx` and css, tests.

- Button: `min-height: var(--control-height); border-radius: var(--radius); font-weight: 700; padding: 0 1rem`.
  Keep the 44px touch rule from the mobile layout as a floor.
- Badge: `height: 1.5rem; padding: 0 0.6rem; font-size: 0.75rem`.
- IconButton `filled`: 38px round, `background: var(--surface-2)`; on the accent header `#fff`
  with a hairline shadow.
- SegmentedControl: `.segmented { background: var(--surface-3); border: 0; border-radius: var(--radius); padding: 4px }`,
  `.thumb { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.1) }`, `.segmentActive { color: var(--accent) }`,
  option `count?: number` renders `<span className={styles.count}>`; active count on
  `var(--accent-soft)`, inactive on `#ddd7cc`.

### Task 4 — section cards and panels

Files: `Details.tsx` and css, `SlidePanel.tsx` and css, new `src/shared/ui/EntityHeader/` (+ test),
`PatientDetailPanel.tsx` and css, `AppointmentDetailPanel.tsx` and css,
`PeakHoursPanel.tsx` if its sections look wrong on grey.

- `.section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; }`,
  sections stacked with `gap: 0.75rem`; `.sectionTitle` muted, 12px, 700, uppercase, `letter-spacing: .07em`.
- `SlidePanel .body { background: var(--bg); }`; title 1.375rem 800; close is `IconButton filled`.
- `EntityHeader({ eyebrow, avatar, title, subtitle, chips })`: avatar tile 60px, `border-radius: 20px`,
  white; title 1.5rem 800; chips row wraps. Phone keeps the solid-sheet rules.
- Patient chips: Active (accent, dot) or Deleted (danger), sex (`male`/`female` badge), each
  allergen as `warn` with ⚠.
- Appointment: eyebrow is the type chip, title `HH:mm – HH:mm`, subtitle weekday, date, minutes.

### Task 5 — forms in sections

Files: `PatientFormPanel.tsx` (+ test), `AppointmentFormPanel.tsx`, `ExaminationEditPanel.tsx`,
`CheckInPanel.tsx`, `CompleteVisitPanel.tsx`, `WalkInPanel.tsx`, `PriceItemPanel.tsx`,
`DiagnosisPanel.tsx`.

- Patient: Identity = No., Animal name, Owner; Animal = Species, Breed, Sex, Date of birth,
  Weight (suffix kg), Color, Chip no.; Medical = Allergens, Medical history, Note.
- Others: wrap the form body in one untitled `DetailSection` (allow `title` to be optional).
- The charges editor already draws its own card; give it the section look rather than nesting.

### Task 6 — empty states and page chrome

Files: `EmptyState.tsx` and css (+ test), `AppLayout.tsx` and css, `PageHeader.module.css`,
`StatGrid.tsx`, `StatCards.module.css`; call sites: `VaccinationsSection`, `RemindersSection`,
`VisitHistory`, `DueList`, `DailyReport`, `DayView` empty state.

- `EmptyState({ message, action, icon?, hint? })`: with `icon`, `border: 1.5px dashed #e3ddd2; border-radius: var(--radius-lg)`,
  icon tile 44px `var(--surface-2)`, title 15px 700, hint 13px faint.
- Brand: 32px tile, `border-radius: 10px`, accent, white "V" 800; Log out pill 34px with border.
- `PageHeader` title `1.75rem` 800, `letter-spacing: -0.02em`; subtitle 14px muted.
- Stat grid: one card, three columns divided by `border-left`; phone keeps three across.

### Task 7 — visual check

Run the stack, log in as the vet test account, and capture every page and panel at 1440×900 and
390×844 before (on the starting commit) and after. Checklist:

- [ ] Every input kind lines up at the same height in a mixed row (patient form, booking form).
- [ ] Focus ring and invalid state visible on each input kind; read-only card number looks fixed.
- [ ] Section cards on grey in every slide panel; no bare fields on grey.
- [ ] Patient and appointment headers show eyebrow, title, subtitle, chips; close button reachable.
- [ ] Segmented controls: calendar views, patient status, price list kind, reports, reminders.
- [ ] Empty states: patient-card sections, reminders, daily report, empty day.
- [ ] Tables, calendar grid and pagination still fit on desktop with 40px controls.
- [ ] Serbian names render in Figtree (š, đ, č, ć, ž); print previews still serif.

Checks before closing: `npx vitest run`, `npx tsc -b`, `npm run lint` in `frontend/`.
