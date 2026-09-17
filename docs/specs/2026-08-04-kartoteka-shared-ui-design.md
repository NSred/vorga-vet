# VorgaVet Frontend — Shared UI Library & Kartoteka Tab (Phase 1)

## Context

The user supplied a self-contained HTML design mockup (a bundled Claude artifact
export) at `frontend/src/design/VorgaVet - Kartoteka (standalone).html`, covering
four tabs: **Kartoteka** (patient records), **Zakazano** (appointment calendar),
**Dijagnoze** (diagnosis codex), and **Izveštaji** (reports). The mockup's data is
static/in-browser demo data; there is no backend domain for any of this yet — the
real backend (`backend/src/Domain`) only has `Users` (auth) and a sample `Todos`
slice.

This spec covers **Phase 1 only**: standing up a shared, reusable UI component
library (buttons, the right-side slide-in panel, form controls, loading states,
etc.) and building the **Kartoteka** tab on top of it, against a temporary mock
data layer. Zakazano, Dijagnoze, and Izveštaji are deferred to their own future
specs — Zakazano in particular is expected to reuse most of the shared components
built here.

Full mockup reconnaissance (exact field names, column names, modal layouts, color
tokens) was captured during brainstorming and is reflected in the sections below;
the mockup file itself remains available at the path above for reference during
implementation.

## Goals

- A `shared/ui/` component library — Button, IconButton, SlidePanel, Select,
  TextField, Textarea, Badge, Table, Pagination, SearchInput, Spinner, Skeleton,
  EmptyState — built once, generically, so Zakazano (and later Dijagnoze/
  Izveštaji) can reuse it without rework.
- A working Kartoteka tab: stat cards, search/filter bar, sortable/paginated
  table, and right-side panels for viewing, editing, and creating a patient —
  matching the mockup's structure and Serbian field labels.
- A mock data layer (`features/kartoteka/api/`) shaped so that swapping in real
  HTTP calls later touches only that folder, not the UI.
- Correct interactive behavior (focus trap, Escape-to-close, outside-click,
  scroll lock) for the slide-in panel and dropdowns, via Radix UI primitives
  restyled with our own CSS Modules — not hand-rolled.

## Non-goals (explicitly out of scope for this pass)

- **Zakazano, Dijagnoze, Izveštaji** — separate future specs. The nav shows only
  Kartoteka for now (no disabled placeholder tabs).
- **Any backend work** — no new domain entities, no API endpoints. Purely
  frontend, against mock data.
- **Tests** — no vitest/playwright setup in this pass; the frontend currently
  has none. Revisit once the shared library and Kartoteka have settled.
- **"＋ Pregled" (add-visit) form and RTG/findings file upload** — visit history
  is shown read-only; adding visits is a later addition.
- **Real print styling** for `Štampaj` — renders as a disabled/no-op button.
- **A styled confirmation dialog** for delete — uses a plain `window.confirm()`.
- **Visual polish / pixel-matching the mockup** — the user explicitly said not
  to over-invest in styling this pass; get structure and behavior right first.
- **i18n / translation infrastructure** — Kartoteka is hardcoded Serbian text
  (matching the mockup verbatim), while the existing auth pages are hardcoded
  English. This inconsistency is accepted for now (see Risks).

## Stack additions

| Package | Purpose |
|---|---|
| `@radix-ui/react-dialog` | Unstyled, accessible dialog primitive — powers the shared `SlidePanel` (focus trap, Escape, outside-click, portal, scroll lock) |
| `@radix-ui/react-select` | Unstyled, accessible select primitive — powers the shared `Select` |

Both are restyled entirely with our own CSS Modules to match the mockup's look.
No design-system/Tailwind adoption — stays consistent with the CSS Modules
convention already used in `features/auth`.

## Folder structure

```
frontend/src/
├── shared/
│   ├── ui/                         # NEW
│   │   ├── Button/                 # primary/secondary/outline/danger variants
│   │   ├── IconButton/             # close (✕), dark-mode-style icon actions
│   │   ├── SlidePanel/             # Radix Dialog-based right-side panel shell
│   │   │                           #   (colored-band or plain header slot,
│   │   │                           #    scrollable body, sticky footer slot)
│   │   ├── Select/                 # Radix Select wrapper
│   │   ├── TextField/              # labeled input + error slot
│   │   ├── Textarea/                # labeled textarea + error slot
│   │   ├── Badge/                   # colored pill; tone: male/female/warn/danger/neutral/ok
│   │   ├── Table/                   # generic sortable table shell
│   │   ├── Pagination/
│   │   ├── SearchInput/             # pill input, icon prefix
│   │   ├── Spinner/
│   │   ├── Skeleton/
│   │   ├── EmptyState/
│   │   └── index.ts                 # barrel export
│   ├── lib/                          # existing (apiClient.ts, tokenStorage.ts, ...)
│   └── config/                        # existing
├── features/
│   ├── auth/                          # existing, untouched
│   ├── dashboard/                     # REMOVED — replaced by kartoteka as "/"
│   └── kartoteka/                     # NEW
│       ├── api/
│       │   ├── patientsApi.ts         # mock CRUD, shaped like a future real client
│       │   ├── statsApi.ts            # mock dashboard-stat numbers (see below)
│       │   └── mockData.ts            # seeded in-memory patient array
│       ├── types.ts                   # Patient, Visit
│       ├── components/
│       │   ├── StatCards.tsx
│       │   ├── PatientFilters.tsx
│       │   ├── PatientTable.tsx
│       │   ├── PatientDetailPanel.tsx  # view mode
│       │   └── PatientFormPanel.tsx    # shared create + edit
│       ├── pages/
│       │   └── KartotekaPage.tsx
│       └── index.ts
└── app/
    ├── layout/AppLayout.tsx           # gains a "Kartoteka" nav link
    └── routes.tsx                     # "/" now renders KartotekaPage
```

## Data model

```ts
interface Patient {
  id: string
  cardNumber: string        // Rbr — auto-generated 5-digit string on create
  name: string               // Ime
  species: 'pas' | 'macka' | 'ptica' | 'ostalo'
  breed: string               // Rasa
  sex: 'muzjak' | 'zenka'      // Pol
  birthDate?: string            // Datum rođenja (ISO date string)
  age?: number                   // Godine — independent field, not derived
  weightKg?: number
  color?: string
  chipNumber?: string
  cardStatus: 'aktivan' | 'obrisan'   // drives Aktivni/Svi/Brisani filter (soft delete)
  allergies: 'nema' | 'hrana' | 'lekovi' | 'buve_krpelji' | 'polen' | 'ostalo'
  anamnesis?: string
  note?: string                        // internal note, create-form only field in mockup
  ownerName: string                     // Vlasnik
  phone?: string
  mobile?: string
  address?: string
  city: string
  totalServicesRsd?: number             // Finansije: Ukupno usluge
  paidRsd?: number                       // Finansije: Plaćeno
  // "Saldo" is derived (totalServicesRsd - paidRsd), not stored
  visits: Visit[]                        // Istorija pregleda — read-only display
}

interface Visit {
  id: string
  type: string        // e.g. "Vakcinacija", "Dehelmintizacija", "Pregled"
  date: string
  title: string
  description?: string
  costRsd?: number
}
```

## Mock data layer

`features/kartoteka/api/patientsApi.ts` exposes async functions mirroring what a
real API client will eventually look like:

```ts
getPatients(filters?: PatientFilters): Promise<Patient[]>
getPatient(id: string): Promise<Patient>
createPatient(data: PatientInput): Promise<Patient>
updatePatient(id: string, data: PatientInput): Promise<Patient>
softDeletePatient(id: string): Promise<void>
```

Backed by an in-memory array seeded in `mockData.ts` (a handful of patients,
shaped like the mockup's sample rows — species emoji driven off `species`, not
stored). Each function awaits a shared `simulateLatency()` helper (in
`shared/lib`, e.g. ~300–500ms) so the `Spinner`/`Skeleton` components are
actually exercised during development. Filtering/sorting/pagination happens
client-side over the full seeded array. Errors (e.g. not-found) throw the same
shape of error the real `apiClient` throws, so callers don't need to change when
this is swapped for real HTTP later.

`statsApi.ts` provides the two stat-card numbers that depend on appointment data
we don't model yet: a small **standalone** seeded dataset (an hourly bucket count
for 07:00–20:00, and a "today's appointment count" number) — intentionally *not*
a real `Appointment` entity, since that belongs to the Zakazano spec. When
Zakazano is built, these two stat cards get rewired to derive from its real
(then mock, then real) appointment data instead of this placeholder.

## Kartoteka tab

**Page layout** (`KartotekaPage`, the new `/`):
1. Header — "Kartoteka pacijenata" title, subtitle, "＋ Novi pacijent" button
   (opens the create panel)
2. 4 stat cards (`StatCards`) — Ukupno pacijenata, Najtraženiji sat, Danas
   zakazano, Sa alergijama — all wired to mock data per above (first and fourth
   from `patientsApi`, second and third from `statsApi`)
3. Filter/search bar (`PatientFilters`) — search input; `Vrsta`/`Pol`/
   `Alergije`/`Grad` selects; `Dužnici` checkbox; `Aktivni/Svi/Brisani`
   segmented toggle; `Poništi` reset — filters the mock data client-side
4. Table + pagination (`PatientTable`) — columns `Rbr · Ime · Vlasnik · Rasa ·
   Pol · God · Telefon · Alergije · Adresa · Grad`, sortable except
   Telefon/Adresa, row click opens the detail panel

**Detail panel** (`PatientDetailPanel`, view mode) — colored header band
(species icon, name, "Rasa · X god."), sections `Osnovni podaci ·
Medicinska evidencija · Kontakt vlasnika · Finansije · Istorija pregleda`
(read-only visit list), footer `Obriši · ✎ Izmeni · 🖨 Štampaj`:
- `Obriši` → `window.confirm()`, then `softDeletePatient` (sets
  `cardStatus: 'obrisan'`)
- `✎ Izmeni` → swaps panel body to `PatientFormPanel` in edit mode
- `🖨 Štampaj` → rendered disabled (no-op) for this pass

**Form panel** (`PatientFormPanel`, shared create/edit) — single flat form (no
section grouping, matching the mockup's create form), all fields from the data
model above; `Rbr*`/`Ime*`/`Vlasnik*` required, rest optional; `Rbr` pre-filled
with an auto-generated 5-digit value on create. Footer `Odustani · Sačuvaj` on
create, `Obriši · Sačuvaj izmene` on edit.

**Routing/nav**: `app/routes.tsx` — `/` renders `KartotekaPage` (inside the
existing `ProtectedRoute` + `AppLayout`), replacing the placeholder
`DashboardPage`. `AppLayout` header gains a "Kartoteka" nav link (styled active
when on `/`). No Zakazano/Dijagnoze/Izveštaji links yet.

## Risks / follow-ups

- **English/Serbian inconsistency**: auth pages are English, Kartoteka is
  Serbian. Accepted for now per the user's explicit choice; revisit if/when i18n
  is ever tackled, or if the auth pages get translated to match.
- **Stat-card mock data duplication**: `statsApi`'s standalone appointment-ish
  numbers will need to be replaced (not just extended) once Zakazano models real
  appointments — flagged above, not a surprise when it happens.
- **Backend swap**: when the real Patient domain/API exists on the backend,
  only `features/kartoteka/api/*` should need to change; `types.ts` may need
  adjustment if the real API shape differs from what we guessed here from the
  mockup.
- **Radix bundle size**: both packages are small and tree-shakeable, but this is
  the first UI dependency beyond React itself — worth a quick sanity check on
  bundle impact after implementation.
