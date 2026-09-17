# Peak hours panel — implementation record

Status: implemented 2026-08-05. Design in
`docs/superpowers/specs/2026-08-05-peak-hours-panel-design.md`.

Originally a three-task plan with full code inline. The code is in the repository now, so that
detail has been removed and only the decisions remain.

## What was built

Clicking the peak hour stat card on the patients dashboard opens a side panel showing booking
patterns across the mock appointment data: peak hour, busiest day, hourly breakdown and weekday
breakdown.

Three passes: the `getPeakHoursBreakdown` data function, the `PeakHoursPanel` component, then
turning the stat card into a button and verifying end to end.

## Decisions worth knowing

**The breakdown is derived, not stored.** `getPeakHoursBreakdown` computes from the existing
`getAppointments()`, reusing the cross-feature pattern already established for
`getDashboardStats`. Nothing new was persisted.

**The panel fetches its own data** when opened, rather than the page fetching and passing it
down. It is self-contained and costs nothing while closed.

**Existing sources of truth were reused rather than duplicated:** the hour range is fixed
07:00–20:00 to match the day view, and weekday names come from the existing `WEEKDAYS` array
(Sunday-first at source, reordered to Monday-first for display) rather than a new list.

**Close via the panel header only**, no footer button, consistent with every other panel.

## Stale references

This plan predates commit `13e205f`, which renamed the feature folders and translated the UI to
English. Any `kartoteka` / `zakazano` naming or Serbian text here refers to what are now
`patients` and `appointments`.
