# TanStack Query on the patients feature — design

Date: 2026-08-27
Status: designed, not implemented.

## Goal

Move the patients feature's server state onto TanStack Query, deleting the hand-rolled fetching
machinery that currently reimplements caching, race guarding and invalidation by hand.

## Why

The patients CRUD work left three copies of the same pattern in the codebase, each slightly
different:

- `PatientsPage` guards races with a `latestRequest` ref, builds a cache key with
  `JSON.stringify`, carries four `useState` pairs for data and loading, and invalidates by calling
  its loaders again from `afterWrite`.
- `useEntitySearch` repeats the ref, the debounce and the loading state for the four pickers.
- `AppointmentsPage` repeats a simpler version with no race guard at all.

None of this is wrong, but all of it is library work written by hand. Query also supplies things
the current code does not have: a cache that survives navigation, request deduplication across
components, and retry.

The dependent allergen fetch is the sharpest argument. It resolves a name from the URL into an
option before the list query can run, and its "still resolving" flag was originally derived from
the result — so a name that matched nothing was indistinguishable from one still in flight, and the
table froze on a permanent skeleton. A `useQuery` cannot express that bug: `isPending` belongs to
the request's lifecycle, not to whether the result was interesting.

## Scope

In scope: the patients feature only — `PatientsPage`, `useEntitySearch` and the four pickers that
consume it, the dashboard stats query, and the app-level provider.

Out of scope: appointments and auth keep their current fetching code. Writes keep their current
shape. No backend changes. No optimistic updates.

Two idioms therefore coexist until appointments is migrated. That is an accepted cost of piloting
on one feature.

## Decisions

| Decision                | Choice                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| Adoption scope          | Patients only, as a pilot                                          |
| Writes                  | Stay as plain awaited calls; invalidate manually                   |
| `staleTime`             | 30 seconds                                                         |
| `refetchOnWindowFocus`  | On (Query's default)                                               |
| Filter state            | Unchanged — the URL stays the source of truth                      |
| Detail fetching         | Imperative via `queryClient.query`, not `useQuery`                 |

Writes stay imperative because `PatientFormPanel` already has react-hook-form's `isSubmitting`
owning its submit state; a `useMutation` would introduce a second loading flag to reconcile, and
the delete's `NotFound` / `AlreadyDeleted` forgiveness would have to move into a mutation error
handler for no gain.

## Setup

`@tanstack/react-query` as a dependency, `@tanstack/react-query-devtools` as a dev dependency.

A new `src/shared/lib/queryClient.ts` owns the client and its defaults:

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
    },
  },
})
```

The retry predicate is not decoration. `apiFetch` already handles 401 by refreshing the token and
retrying once itself, throwing `ApiError(401)` only after the refresh has genuinely failed; Query's
default `retry: 3` would then retry a dead session three more times. Not retrying 4xx also makes a
`Patients.NotFound` fail immediately rather than after backoff.

`App.tsx` gains `QueryClientProvider` as the outermost wrapper, above `ToastProvider`. Devtools
mount inside it, gated on `import.meta.env.DEV`.

## Query keys

A new `src/features/patients/api/patientKeys.ts`:

```ts
export const patientKeys = {
  all: ['patients'] as const,
  list: (filters: PatientFilters, page: number, pageSize: number) =>
    [...patientKeys.all, 'list', filters, page, pageSize] as const,
  detail: (id: string) => [...patientKeys.all, 'detail', id] as const,
}
```

The filters object goes into the key directly. Query hashes keys structurally, which is what
replaces the `JSON.stringify` cache key and the `eslint-disable react-hooks/exhaustive-deps` that
came with it. Keys match by prefix, so invalidating `patientKeys.all` clears every cached list page
and every cached detail in one call.

## The read layer

A new `src/features/patients/hooks/usePatientsQuery.ts` holds the hooks. The allergen resolution
becomes two composed queries:

```ts
const allergenQuery = useQuery({
  queryKey: ['allergens', 'byName', allergenName],
  queryFn: () => searchAllergens(allergenName),
  enabled: Boolean(allergenName),
  select: (results) =>
    results.find((c) => c.name.toLowerCase() === allergenName.toLowerCase()) ?? null,
})

const isAllergenPending = Boolean(allergenName) && allergenQuery.isPending
```

The list query gates on it and keeps previous rows while refetching:

```ts
useQuery({
  queryKey: patientKeys.list(activeFilters, page, pageSize),
  queryFn: () => getPatients(activeFilters, page, pageSize),
  enabled: !isAllergenPending,
  placeholderData: keepPreviousData,
})
```

`keepPreviousData` means paging or changing a filter keeps the old rows on screen instead of
flashing the skeleton — behaviour the current code does not have.

The table's loading prop stays `isLoading || isAllergenPending`, matching today. This matters
because a query disabled by `enabled: false` reports `isLoading: false`, so the gate has to be
expressed explicitly or the table would render empty rather than a skeleton while the allergen
resolves.

`useEntitySearch` keeps its name and its `EntitySearchState<T>` return shape, so the pickers'
rendering does not change. Its body loses the ref, the three `useState`s and the effect, keeping
only the debounce and a `useQuery`.

Its signature does gain one parameter. The hook takes a `fetcher` function, and a function
reference cannot serve as a query key, so callers must pass an explicit key prefix:
`useEntitySearch(['allergens'], fetcher)`. `BreedPicker`'s prefix must include the species its
fetcher closes over — `['breeds', species]` — or switching species would read another species'
cached breeds.

That prefix is also the deduplication mechanism. `AllergenFilter` and `AllergenPicker` both passing
`['allergens']` is precisely what collapses their two independent requests into one.

## Writes

`PatientFormPanel` is untouched. Only `afterWrite` changes:

```ts
const afterWrite = (title: string) => {
  closePanel()
  queryClient.invalidateQueries({ queryKey: patientKeys.all })
  queryClient.invalidateQueries({ queryKey: ['stats'] })
  showToast({ tone: 'success', title })
}
```

`handleDelete` keeps its body verbatim, including the `Patients.NotFound` / `Patients.AlreadyDeleted`
handling, and ends in the new `afterWrite`.

## Opening a patient

`openPatient` and the `?patient=` deep-link effect stay promise-based, routed through
`queryClient.query` with `patientKeys.detail(id)`. It respects `staleTime`, so reopening the same
patient inside 30 seconds costs no request.

Use `query`, not `fetchQuery`. As of `@tanstack/query-core` 5.102.8 `fetchQuery` is deprecated in
favour of `query`, which takes the same options and returns the same promise.

Staying imperative here is deliberate. It preserves the `panel` / `displayPanel` split that drives
the slide-out exit animation, and the `key={displayPanel.patient.id}` on the edit panel that stops
`BreedPicker` from clearing the prefilled breed. Both were delicate to get right and neither
benefits from being expressed as a `useQuery`.

## Testing

A new `src/test/renderWithQuery.tsx` wraps a render in a `QueryClientProvider`. It must build a
fresh `QueryClient` per test — a shared client leaks cache between tests and produces
order-dependent failures — and set `retry: false` so a rejected mock fails immediately.

Existing tests change by roughly two lines each: import the helper, swap the `render` call. The
`vi.spyOn(patientsApi, 'getPatients')` mocks keep working unchanged, because the `queryFn` calls the
same module function.

Expect some call-count assertions to shift. Where two components previously each fired a request,
deduplication now produces one. These are found by running the suite, not predicted in advance, and
the correct fix is to adjust the expectation rather than to defeat the dedup.

## What this removes

From `PatientsPage`: the `latestRequest` ref, `searchKey`, the `loadPatients` callback and its
lint suppression, `EMPTY_PAGE`, `refreshStats`, the `allergenResolution` state and its effect, and
four `useState` pairs — about 60 lines down to about 20.

From `useEntitySearch`: the ref, three `useState`s and the effect — about 30 lines down to about 10.

## Costs

Roughly 13 kB gzipped. One more concept for a reader to know. Two fetching idioms in the codebase
until appointments follows.

## Follow-ups, not in this change

- Migrate `AppointmentsPage`, which today refetches with no race guard.
- Consider `useMutation` if optimistic updates are ever wanted.
- TanStack Table was considered and declined. It is headless, so styling is not the obstacle, but it
  buys no performance here — it does not virtualize, and the table renders at most 50 server-paginated
  rows. Its main draw, column sorting, is blocked on the backend, which always orders by `Name`
  ascending with no sort parameter; `Table`'s existing `sortable` / `onSortChange` props are dead
  code for that reason. Revisit if sort parameters land, or if column visibility, reordering or bulk
  row selection is wanted.
