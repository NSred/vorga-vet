# Shared UI library and patient records tab — implementation record

Status: implemented 2026-08-04. Design in
`docs/superpowers/specs/2026-08-04-kartoteka-shared-ui-design.md`.

Originally a sixteen-task plan with full code inline. The code is in the repository now, so
that detail has been removed and only the decisions remain.

At the time this feature was called *Kartoteka*. It is now `features/patients` — see "Stale
references" below.

## What was built

**The `shared/ui` library**, in this order: `Button` and `IconButton`; `Badge`, `Spinner`,
`Skeleton`, `EmptyState`; `TextField`, `Textarea`, `SearchInput`; `Select`; `SlidePanel`;
`Table` and `Pagination`; then the barrel export and the `simulateLatency` helper.

**The patient records tab** on top of it: types and mock data layer, stat cards, filters,
table, detail panel, create/edit form panel, and the page itself. It replaced the placeholder
dashboard as the app's home page.

## Decisions worth knowing

**Radix only where accessibility is hard.** `SlidePanel` (Radix Dialog) and `Select` (Radix
Select) use primitives because focus trapping and listbox semantics are genuinely difficult to
hand-roll. Everything else is plain CSS Modules.

**The mock API was shaped like a real one.** `api/` exposes async functions returning promises,
so swapping in real HTTP later touches only that folder. That prediction held: when
`POST /patients` was wired up on 2026-08-26, the change was confined to `api/` plus the form.

**Types live in one place.** `Patient`, `PatientInput` and `PatientFilters` are defined once
and imported everywhere; no component redefines them.

**No tests this pass**, a deliberate deviation from the usual TDD default, agreed at the time.
Verification was the dev server and browser. A test framework arrived on 2026-08-26.

## Stale references

This plan predates commit `13e205f`, which renamed `features/kartoteka` to `features/patients`
and translated the UI from Serbian to English. Folder names, component paths and UI strings
here no longer match the code.
