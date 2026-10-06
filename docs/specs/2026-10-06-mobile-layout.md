# Mobile layout: phone-width navigation, tables and panels

Status: Implemented. Builds on the [shared UI library](2026-08-04-kartoteka-shared-ui.md), the
[layered structure](2026-08-29-frontend-layered-structure.md) and the
[frontend consolidation](2026-10-06-frontend-consolidation.md). The shared-code changes are also
listed in the app-wide table of the
[hardening document](2026-09-21-frontend-hardening-before-scheduling.md).

## What this adds

A vet or a client can use the app on a phone held upright without pinching or scrolling
sideways:

- **The page never scrolls sideways.** Before, the patients table pushed the document to more
  than twice the phone's width, which also dragged the side panel out of view.
- **The navigation is a strip of all tabs under the brand**, scrollable sideways with a fade at
  the edges, and the active tab always ends up in view. The user's email leaves the header on
  phones; Log out stays.
- **Lists read as cards.** A table with many columns stacks each row into a card with the column
  names as small labels; short tables stay tables.
- **Side panels fill the phone screen**, with the title and the action row always visible and the
  content scrolling between them. Centred dialogs stay centred and fit the screen.
- **The calendar opens in day view on a phone**, the toolbar groups into rows, the week grid
  scrolls to today and the month view shows a tappable count per day.
- **Controls are big enough for a thumb** on touch phones.
- **Printing is a desktop task.** Print buttons are hidden on phones. A rabies certificate can
  still be issued and a microchip registered there; the paper is printed later on a computer.

Desktop is unchanged. Out of scope: a native-app shell, offline use, swipe gestures on the
calendar, and any backend change. A later document can cover a bottom tab bar if the scroll strip
proves not enough.

## Backend contract

No endpoint is added or changed. Every page keeps the calls it makes today.

The one backend rule the phone work ran into is the rate limit on `users/login`,
`users/refresh-token` and `users/register`: ten calls per minute per client in
`RateLimiting:Authentication`. Every full page load refreshes the token, and a refused refresh
logs the user out. Ordinary use never comes near it; scripted checks that reload pages do.

## Design

**Breakpoints are a convention, not a token.** CSS Modules cannot share a custom media query
without a PostCSS plugin, so the widths are written literally: a **phone** is at most 40rem
(640px) wide. Phone rules sit in each component's own stylesheet under
`@media (max-width: 40rem)`. Touch sizing uses `@media (max-width: 40rem) and (pointer: coarse)`,
so a touch laptop or a desktop with a touch screen keeps today's control sizes.

**Desktop does not change.** Every rule sits behind the phone breakpoint. The markup changes that
reach desktop are invisible there: a scroller around each table, a hidden month-view shortcut,
`display: contents` groups in the calendar toolbar, a `hideOnPhone` class on print buttons and
a `print` option on two dialogs that stays on outside phones.
Desktop screenshots of the patients page, the open patient panel, week, month and reports were
pixel-identical before and after at 1440×900. The one deliberate desktop change is a bug fix:
picking a day from the week or month view now opens that day.

**One root cause for the panel complaint.** The side panel is `position: fixed` with `right: 0`
and `width: min(35rem, 100vw)`. On a phone the browser widens its layout viewport to the widest
element in the page, so the panel followed the overflowing patients table and landed to the right
of the screen. Two changes keep it from happening again: `main` clips horizontal overflow on
phones, and every table sits in a scroller of its own. The panel then only needs sizing rules.

**Header: two rows on a phone.** The header becomes a grid with brand and Log out on top and the
nav strip spanning the second row; the left group uses `display: contents` so the desktop flex
layout and markup stay as they were. The strip keeps its pills and sliding thumb, fades its
clipped ends with a mask, and has scroll padding as wide as the fade so the active pill never
sits under it. The existing effect that scrolls the active link into view also re-measures the
thumb on resize. A hamburger drawer and a bottom tab bar were considered: the drawer hides where
the user is, and the tab bar does not fit six vet tabs with labels.

**Tables: cards from the same markup.** `Table` still renders a real `<table>`, which keeps
sorting, skeletons and the existing tests. A column may declare `mobile`: `'title'` for the card
heading, `'detail'` for a label and value line, `'hidden'` to drop it on phones. When any column
declares it, the table gets `data-cards` and each cell a `data-label` and `data-mobile`; phone CSS
then hides `thead`, turns each row into a card and draws the label from `attr(data-label)`. The
title cell moves to the top with `order`, whatever its column position. A table with no `mobile`
field never becomes cards, which is right for the two- and three-column lists such as the price
list and diagnoses.

The patients table shows number, owner, breed, sex, age, phone and allergies on the card and
hides address and city. Number and allergies stay because a vet searches by card number and must
see an allergy before opening the card. The daily report, unpaid exams and deleted cards tables
mark the patient as the title. Vaccinations, reminders and the microchip are `RecordList`s rather
than tables, so they only gained a wrap rule.

**Panels.** On phones `SlidePanel` is `inset: 0` and `100dvh` tall, slides up from the bottom,
and drops its glass background for a solid one, because a blurred page behind a full-screen sheet
made the text harder to read. Header and footer stay put while the body scrolls; footer buttons
share the width and wrap, and the footer clears the safe area. `Modal` stays a centred card capped
at the screen height.

**Forms and filters.** `layout.formRow` collapses to one column at or under 22.5rem; at 390px two
columns still fit. In filter toolbars the search takes the full row and the other controls share
the width. The charges editor's service and medication pickers stack, because side by side their
placeholders wrapped.

**Calendar.** `parseViewParams` takes a fallback view, and `AppointmentsPage` passes day on a phone
and week otherwise, from the new `useMediaQuery` hook in `shared/lib`. A URL with an explicit view
wins, so a shared link behaves the same everywhere. The week grid scrolls today's column into view
whenever it overflows, with a sticky time column and snapping day columns on phones. The toolbar
becomes three rows: view and period navigation, date and Show cancelled, then the two actions.
The month view hides its chips on phones; a day with visits shows a dot and the count as a button
that opens that day.

**Touch sizing.** `tokens.css` gains `--touch-target` (44px), used under the touch phone query by
buttons, icon buttons, pagination, the calendar arrows, the search box, nav pills and the
segmented control. The calendar arrows keep 44px of height but only 36px of width, so the view
switch and navigation fit one row. Inputs were already 16px, so iOS does not zoom on focus.

**Toasts and tiles.** Toasts span the width at the bottom on phones, inside the safe area. The
dashboard tiles sit three across as compact tiles; one column was tried and pushed the list a
full screen down.

**Printing is hidden on phones.** `layout.hideOnPhone` is on the report Print button, Print
certificate and Print registration sheet. Issuing a certificate and registering a microchip stay
available, because the record is useful on its own. `IssueCertificateDialog` and
`RegisterMicrochipDialog` take a `print` option, which the sections turn off on phones through
`useMediaQuery`: the button then reads "Issue certificate" or "Register", nothing is sent to the
printer, and the reprint button prints the form later on a computer. The microchip form also
drops the owner's JMBG on phones, since it exists only to be printed and is never saved; the
reprint asks for it. Print layout itself is untouched: a report printed from the phone build
renders the A4 sheet, not the cards.

**What tests can and cannot prove.** jsdom does not apply media queries, so layout was checked in
a phone browser against the real API. Unit tests cover the DOM: the card attributes appear only
when asked, hidden columns still render, `useMediaQuery` follows `matchMedia`, the appointments
page picks day view on a phone and keeps an explicit view, picking a day opens that day, the month
shortcut opens its day, a certificate and a microchip registration on a phone save without
printing, and the nav has an accessible name.

## Tasks

- [x] **Shell foundation**: overflow clip, `dvh`, touch-size token, toast viewport on phones.
      Existing layout and toast tests pass; the rest was checked on a phone.
- [x] **Header strip**: two-row header, scrollable strip with edge fades, email hidden. Tests
      prove both roles still see their links and the strip has an accessible name.
- [x] **Panels and dialogs**: full-screen sheets, screen-height cap for dialogs, shared footer
      width. Existing panel and dialog tests pass unchanged.
- [x] **Table cards**: scroller, `mobile` column option, card CSS on the patients and report
      tables. Tests prove the attributes appear only when asked, every column renders and a card
      click opens the row.
- [x] **Calendar on phones**: day view default, grouped toolbar, week to today, month counts.
      Tests prove the hook, the default and explicit views, and that a picked day opens.
- [x] **Filters, forms and tiles**: one-column forms on narrow phones, full-width search,
      compact tiles, stacked charge pickers. Existing page tests pass.
- [x] **Phone checklist**: every vet and client screen at 390×844 and 360×740 against the real
      API; the fixes it found are in this document.

## Where it lives

```
frontend/src/
  index.css                               + dvh minimum height
  app/layout/AppLayout.tsx                + nav aria-label, thumb re-measured on resize
  app/layout/AppLayout.module.css         + two-row header and nav strip on phones
  pages/AppointmentsPage.tsx              + phone default view; openDay writes date and view at once
  pages/ReportsPage.tsx                   + Print hidden on phones
  shared/lib/useMediaQuery.ts             matchMedia as a hook, with PHONE_QUERY
  shared/ui/tokens.css                    + --touch-target
  shared/ui/layout.module.css             + hideOnPhone, phone toolbars, one-column formRow
  shared/ui/Table/Table.tsx               + scroller, mobile column option, data attributes
  shared/ui/Table/Table.module.css        + card layout on phones
  shared/ui/SlidePanel/SlidePanel.module.css   + full-screen sheet on phones
  shared/ui/Modal/Modal.module.css        + screen-height cap, phone padding
  shared/ui/Toast/Toast.module.css        + full-width viewport on phones
  shared/ui/{Button,IconButton,Pagination,SearchInput,SegmentedControl,RecordList}/*.module.css
                                          + touch sizes and phone wrapping
  features/appointments/lib/appointmentViewParams.ts   + fallback view parameter
  features/appointments/components/CalendarToolbar.*   + row groups for phones
  features/appointments/components/WeekView.*          + scroll to today, sticky times
  features/appointments/components/MonthView.*         + day count shortcut on phones
  features/patients/components/PatientTable.tsx        + mobile column hints
  features/priceList/components/ChargesEditor.module.css + stacked pickers on phones
  features/vaccinations/components/VaccinationsSection.tsx + reprint hidden, issue without printing on phones
  features/vaccinations/components/IssueCertificateDialog.tsx + print option
  features/microchips/components/MicrochipSection.tsx      + reprint hidden, register without printing on phones
  features/microchips/components/RegisterMicrochipDialog.tsx + print option, JMBG only when printing
  widgets/dashboard/components/StatCards.module.css        + compact tiles on phones
  widgets/reports/components/{DailyReport,UnpaidExams,DeletedCards}.tsx + mobile column hints
  widgets/reports/components/Reports.module.css            + no double frame around cards
```

## Notes from implementation

- **Scroll snapping fought the nav.** The strip first used `scroll-snap-type: x proximity`.
  Scrolling a half-visible pill into view moved the strip about 40px, and snapping pulled it back
  to the start, so at 360px the Lists tab stayed cut off. Snapping is gone from the strip.
- **Picking a day opened the wrong one, on desktop too.** `openDay` called two setters that each
  rebuilt the URL from the same stale search params, so the second dropped the date. It predates
  this work; the phone month shortcut exposed it.
- **CRLF in this checkout.** `git` uses `core.autocrlf`, so working files have CRLF while Prettier
  expects LF, and `prettier --check` flags untouched files too. Check with
  `--end-of-line auto`; commits are normalised.
- **Not covered on a phone:** the client's visit list with real visits, since the test client
  had none.
