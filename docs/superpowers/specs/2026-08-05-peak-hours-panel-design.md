# VorgaVet Frontend — "Najtraženiji sat" Peak Hours Panel

## Context

The reference mockup (`frontend/src/design/VorgaVet - Kartoteka (standalone).html`)
has a right-side drawer ("Najtraženiji termini") that opens when you click the
"Najtraženiji sat" stat card, showing a breakdown of booking patterns by hour
and by day of week. This was never carried over when the Kartoteka stat cards
were rebuilt in the Zakazano phase — the card is currently static (not
clickable). This spec adds that panel back, wired to our real (mock)
appointment data instead of the mockup's own dataset.

## Goals

- Clicking "Najtraženiji sat" on the Kartoteka dashboard opens a right-side
  panel showing booking patterns aggregated across **all** appointments in the
  mock dataset (not just today — a by-day-of-week breakdown only makes sense
  over a wider range; confirmed with the user that this is intentional even
  though it means the panel's numbers won't necessarily match the small card's
  "today" teaser underneath it).
- Same visual/interaction pattern as the mockup: overview tiles, an hourly bar
  chart (07:00–20:00, matching `DayView`'s hours), and a by-weekday bar chart
  (each day annotated with its own peak hour).
- Built entirely on the existing `SlidePanel` — no new shared component.

## Non-goals

- No backend work — pure client-side computation over the existing mock
  `getAppointments()` data.
- No date-range picker or filtering controls on the panel — always all-time,
  matching the mockup's own scope (it had none either).
- No "sa upisanim vremenom" (has-a-recorded-time) caveat from the mockup —
  our `Appointment.time` is a required field (mockup's wasn't), so every
  appointment always has a time and counts toward the hourly breakdown.
- No footer "Zatvori" button — the mockup has one, but every other panel in
  this app closes only via the header ✕, and the user asked to stay
  consistent with that rather than add a one-off footer button.

## Data model

New types and function in `features/kartoteka/api/statsApi.ts` (co-located
with the existing `getDashboardStats`, following the same pattern of deriving
stats from Zakazano's `getAppointments()`):

```ts
interface HourBreakdown {
  hour: string                 // 'HH:00', e.g. '08:00'
  count: number
}

interface DayBreakdown {
  day: string                  // weekday display name, e.g. 'Sreda'
  total: number
  peakHour: { hour: string; count: number } | null
}

interface PeakHoursBreakdown {
  peakHour: { hour: string; count: number } | null   // busiest hour, all appointments
  busiestDay: DayBreakdown | null
  averagePerDay: number        // totalAppointments / 7, one decimal
  totalAppointments: number
  byHour: HourBreakdown[]      // 07:00..20:00, fixed range, one entry per hour
  byDay: DayBreakdown[]        // Ponedeljak..Nedelja display order
}

function getPeakHoursBreakdown(): Promise<PeakHoursBreakdown>
```

Day names and ordering reuse the existing `WEEKDAYS` array and `formatWeekday`
helper from `zakazano/lib/dateHelpers.ts` (currently Sunday-first, matching
JS `Date.getDay()`); the function reorders to Monday-first for display, same
order the mockup uses (Pon → Ned).

All-zero / no-appointments edge case: `peakHour`/`busiestDay` are `null`,
`averagePerDay` is `0`, every `byHour`/`byDay` entry has `count`/`total: 0`.
The panel renders "—" for null values, same convention already used elsewhere
in the app (e.g. `PatientTable`).

## Component

New file: `features/kartoteka/components/PeakHoursPanel.tsx`.

Unlike the other panels (`PatientDetailPanel`, `AppointmentFormPanel`, etc.)
this one needs no data from its parent — it fetches its own breakdown via
`getPeakHoursBreakdown()` in a `useEffect` keyed on `open` becoming `true`.
That means `KartotekaPage` can mount it unconditionally from the start
(`<PeakHoursPanel open={peakHoursOpen} onOpenChange={setPeakHoursOpen} />`),
sidestepping the "hold the last-shown value so the close animation has
something to animate" pattern the other three panels needed — there's no
external prop that goes `null` on close here. State in `KartotekaPage` is a
plain `useState(false)`, independent of the existing `PanelState` union (no
associated data to carry, so no need to fold it into that discriminated
union).

**Layout** (mirrors the mockup, header tone `plain`, `ariaLabel` "Najtraženiji
termini"):
1. Header: "Najtraženiji termini" / "Raspored zakazivanja po satu i po danu
   nedelje."
2. **Pregled** — 2×2 grid (reusing the same small label/value tile pattern as
   `AppointmentDetailPanel`'s `Field`): Najtraženiji sat, Termina u tom satu,
   Najprometniji dan, Prosečno po danu.
3. **Termini po satu** — one row per hour 07:00–20:00: hour label, a
   horizontal bar (width % of that hour's count against the max across all
   hours), and a count label (`N term.` or `—` for zero). The peak hour's bar
   uses the accent fill; others use a muted fill. Plain CSS `div` width
   percentage — no charting library, consistent with the rest of the app.
4. **Po danu nedelje — ukupno i najtraženiji sat** — one row per weekday
   (Pon–Ned): day name, a horizontal bar (width % of that day's total against
   the max across all days), and that day's own peak hour + count (e.g. "08:00
   (2)", or "—" if the day has zero appointments). Busiest day's bar uses the
   accent fill.
5. Footer note: "Računato na osnovu N termina." (N = `totalAppointments`).

New `PeakHoursPanel.module.css`, following the same per-component CSS Modules
convention as every other panel.

## Trigger

`StatCards.tsx`: the "Najtraženiji sat" card changes from a static `<div>` to
a `<button>` (unstyled-as-button, same visual treatment as the card, `cursor:
pointer` + hover state like "Danas zakazano" already has as a `Link`), taking
a new `onPeakHoursClick: () => void` prop from `StatCardsProps`.
`KartotekaPage.tsx` passes `() => setPeakHoursOpen(true)`.

## Risks / follow-ups

- **Mismatch with the card's "today" number**: by design (per Goals) — the
  card teaser stays scoped to today, the panel is all-time. Worth a quick
  gut-check after implementation that this doesn't read as a bug; if it's
  confusing in practice we can revisit, but it's the more useful view for a
  "when are we usually busiest" question.
