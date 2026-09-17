# TanStack Query on the patients feature — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this
> plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the patients feature's server state onto TanStack Query, deleting the hand-rolled
race guards, cache keys and loading flags that currently reimplement it.

**Architecture:** A single `QueryClient` configured in `shared/lib`, provided at the top of `App`.
Reads become `useQuery` behind feature hooks; writes stay as plain awaited calls that invalidate by
key prefix afterwards. Patient detail fetching stays imperative via `queryClient.fetchQuery` so the
existing panel animation and remount behaviour are undisturbed.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 4 + Testing Library, `@tanstack/react-query` v5.

**Spec:** `docs/superpowers/specs/2026-08-27-tanstack-query-patients-design.md`

## Global Constraints

- **No code comments.** Write the code without explanatory comments; the repo owner adds their own.
- **No git commits.** The repo owner commits their own work. Do not run `git add` or `git commit`
  at any point in this plan. Tasks end at "verify", not "commit".
- Scope is the patients feature only. Do not touch `AppointmentsPage`, the auth feature, or
  `shared/ui/Table`.
- `staleTime` is `30_000`. `refetchOnWindowFocus` stays at Query's default (on).
- Writes stay as plain awaited calls. Do not introduce `useMutation`.
- Test clients must be created fresh per test with `retry: false`.
- Run Prettier over every file touched; the repo is Prettier-clean and must stay that way.

## File Structure

| File                                                | Responsibility                                        |
| --------------------------------------------------- | ----------------------------------------------------- |
| `src/shared/lib/queryClient.ts` (new)                | The client and its retry policy                       |
| `src/test/renderWithQuery.tsx` (new)                 | Fresh-client test wrapper for components and hooks     |
| `src/features/patients/api/patientKeys.ts` (new)     | Query key factory for the patients feature             |
| `src/features/patients/hooks/usePatientsQuery.ts` (new) | The three read hooks the page consumes             |
| `src/features/patients/hooks/useEntitySearch.ts`     | Rewritten body; signature gains a key prefix           |
| `src/features/patients/pages/PatientsPage.tsx`       | Loses its fetching machinery, consumes the hooks       |
| `src/app/App.tsx`                                    | Gains `QueryClientProvider` and devtools               |

---

### Task 1: Install the library and provide the client

**Files:**

- Modify: `frontend/package.json`
- Create: `frontend/src/shared/lib/queryClient.ts`
- Create: `frontend/src/shared/lib/queryClient.test.ts`
- Modify: `frontend/src/app/App.tsx`

**Interfaces:**

- Consumes: `ApiError` from `@/shared/lib/apiClient` (has a numeric `status` property).
- Produces: `queryClient` (a configured `QueryClient`) and `shouldRetry(failureCount: number,
  error: unknown): boolean`, both exported from `@/shared/lib/queryClient`.

- [ ] **Step 1: Install the dependencies**

Run from `frontend/`:

```bash
npm i @tanstack/react-query
npm i -D @tanstack/react-query-devtools
```

- [ ] **Step 2: Write the failing test for the retry policy**

Create `frontend/src/shared/lib/queryClient.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ApiError } from './apiClient'
import { shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('does not retry client errors', () => {
    expect(shouldRetry(0, new ApiError(404, 'Not found', 'Patients.NotFound'))).toBe(false)
    expect(shouldRetry(0, new ApiError(401, 'Session expired'))).toBe(false)
  })

  it('retries server errors at most twice', () => {
    const error = new ApiError(500, 'Server error')
    expect(shouldRetry(0, error)).toBe(true)
    expect(shouldRetry(1, error)).toBe(true)
    expect(shouldRetry(2, error)).toBe(false)
  })

  it('retries errors that are not ApiError', () => {
    expect(shouldRetry(0, new Error('Network down'))).toBe(true)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- queryClient`
Expected: FAIL — cannot resolve `./queryClient`.

- [ ] **Step 4: Create the client**

Create `frontend/src/shared/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/lib/apiClient'

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
    },
  },
})
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- queryClient`
Expected: PASS, 3 tests.

- [ ] **Step 6: Provide the client at the root**

Replace the whole of `frontend/src/app/App.tsx`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/features/auth'
import { ToastProvider } from '@/shared/ui'
import { queryClient } from '@/shared/lib/queryClient'
import { router } from '@/app/routes'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
```

- [ ] **Step 7: Verify nothing regressed**

Run: `npm run test`
Expected: PASS — the previous 139 tests plus the 3 new ones. Nothing consumes Query yet, so no
existing test should change behaviour.

Run: `npx tsc -b`
Expected: no output.

---

### Task 2: Convert the entity search hook

**Files:**

- Create: `frontend/src/test/renderWithQuery.tsx`
- Modify: `frontend/src/features/patients/hooks/useEntitySearch.ts`
- Modify: `frontend/src/features/patients/hooks/useEntitySearch.test.ts`
- Modify: `frontend/src/features/patients/components/AllergenFilter.tsx:14`
- Modify: `frontend/src/features/patients/components/pickers/AllergenPicker.tsx:18`
- Modify: `frontend/src/features/patients/components/pickers/BreedPicker.tsx:21`
- Modify: `frontend/src/features/patients/components/pickers/OwnerPicker.tsx:18`
- Modify: the test files listed in Step 7

**Interfaces:**

- Consumes: `useDebouncedValue(value, delayMs)` from `@/shared/lib/useDebouncedValue`.
- Produces: `useEntitySearch<T>(queryKeyPrefix: readonly unknown[], fetcher: (search: string) =>
  Promise<T[]>, enabled?: boolean): EntitySearchState<T>` — the return shape `{ query, setQuery,
  results, isLoading, errorMessage }` is unchanged. Also produces `QueryWrapper`,
  `createTestQueryClient()` and `renderWithQuery(ui)` from `@/test/renderWithQuery`.

- [ ] **Step 1: Create the test wrapper**

Create `frontend/src/test/renderWithQuery.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { useState, type ReactElement, type ReactNode } from 'react'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  })
}

export function QueryWrapper({ children }: { children: ReactNode }) {
  const [client] = useState(createTestQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function renderWithQuery(ui: ReactElement, options?: RenderOptions) {
  return render(<QueryWrapper>{ui}</QueryWrapper>, options)
}
```

`retry: false` makes a rejected mock surface immediately instead of after backoff. `staleTime: 0`
keeps refetch behaviour predictable across tests. Building the client inside `useState` gives every
mounted tree its own cache, which is what stops one test's cached data leaking into the next.

`renderWithQuery` nests rather than passing `wrapper`, so tests that already supply their own
provider tree keep it.

- [ ] **Step 2: Update the existing hook tests to the new signature**

In `frontend/src/features/patients/hooks/useEntitySearch.test.ts`, add the import:

```ts
import { QueryWrapper } from '@/test/renderWithQuery'
```

Then change all four `renderHook` calls to pass a key prefix and the wrapper. The four become:

```ts
const { result } = renderHook(() => useEntitySearch(['entities'], fetcher), {
  wrapper: QueryWrapper,
})
```

```ts
const { result } = renderHook(() => useEntitySearch(['entities'], fetcher), {
  wrapper: QueryWrapper,
})
```

```ts
const { result } = renderHook(() => useEntitySearch(['entities'], fetcher), {
  wrapper: QueryWrapper,
})
```

```ts
const { result } = renderHook(() => useEntitySearch(['entities'], fetcher, false), {
  wrapper: QueryWrapper,
})
```

The fourth is the `does not fetch while disabled` test and keeps its `false` third argument. All
four assertions stay exactly as they are.

- [ ] **Step 3: Add the deduplication test**

Append inside the existing `describe('useEntitySearch', ...)` block in the same file:

```ts
it('shares one request between hooks with the same key', async () => {
  const fetcher = vi.fn().mockResolvedValue([{ id: '1' }])

  renderHook(
    () => {
      useEntitySearch(['allergens'], fetcher)
      useEntitySearch(['allergens'], fetcher)
    },
    { wrapper: QueryWrapper },
  )

  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
})
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -- useEntitySearch`
Expected: FAIL — the hook still takes `(fetcher, enabled)`, so the key array is passed as the
fetcher and the calls reject.

- [ ] **Step 5: Rewrite the hook**

Replace the whole of `frontend/src/features/patients/hooks/useEntitySearch.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'

export interface EntitySearchState<T> {
  query: string
  setQuery: (query: string) => void
  results: T[]
  isLoading: boolean
  errorMessage?: string
}

export function useEntitySearch<T>(
  queryKeyPrefix: readonly unknown[],
  fetcher: (search: string) => Promise<T[]>,
  enabled = true,
): EntitySearchState<T> {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)

  const { data, isFetching, error } = useQuery({
    queryKey: [...queryKeyPrefix, 'search', debouncedQuery],
    queryFn: () => fetcher(debouncedQuery),
    enabled,
  })

  return {
    query,
    setQuery,
    results: data ?? [],
    isLoading: isFetching,
    errorMessage: error instanceof Error ? error.message : undefined,
  }
}
```

`isFetching` rather than `isLoading` is deliberate: it stays true during refetches, matching what
the old hook's manual flag did, and it is false when the query is disabled.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- useEntitySearch`
Expected: PASS, 5 tests.

- [ ] **Step 7: Update the four call sites**

`frontend/src/features/patients/components/AllergenFilter.tsx:14`:

```tsx
const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(['allergens'], fetcher)
```

`frontend/src/features/patients/components/pickers/AllergenPicker.tsx:18` — the same key, which is
what makes the two share a request:

```tsx
const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(['allergens'], fetcher)
```

`frontend/src/features/patients/components/pickers/BreedPicker.tsx:21` — the key must include
`species`, because the fetcher closes over it:

```tsx
const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(
  ['breeds', species],
  fetcher,
)
```

`frontend/src/features/patients/components/pickers/OwnerPicker.tsx:18`:

```tsx
const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(['owners'], fetcher)
```

- [ ] **Step 8: Wrap the affected component tests**

Every test that renders a component using `useEntitySearch` now needs a `QueryClient` in scope.
These are the known files:

- `frontend/src/features/patients/components/AllergenFilter.test.tsx`
- `frontend/src/features/patients/components/PatientFilters.test.tsx` (renders `AllergenFilter`)
- `frontend/src/features/patients/components/pickers/AllergenPicker.test.tsx`
- `frontend/src/features/patients/components/pickers/BreedPicker.test.tsx`
- `frontend/src/features/patients/components/pickers/OwnerPicker.test.tsx`
- `frontend/src/features/patients/components/PatientFormPanel.test.tsx` (renders all three pickers)

In each, import the helper and swap the render call:

```tsx
import { renderWithQuery } from '@/test/renderWithQuery'
```

then replace each `render(<Something ... />)` with `renderWithQuery(<Something ... />)`. Where a
test already wraps in its own providers, keep that tree intact and pass the whole thing to
`renderWithQuery`.

- [ ] **Step 9: Run the full suite and fix what falls out**

Run: `npm run test`

Any file missed in Step 8 fails with `No QueryClient set, use QueryClientProvider to set one` —
that error names the file, so add the wrapper there and re-run.

Separately, watch for call-count assertions that now expect one fewer request because two
components share a key. The correct fix is to adjust the expectation to the deduplicated count, not
to give the components different keys.

Expected once green: 143 tests passing.

---

### Task 3: Add the query keys and the patients read hooks

**Files:**

- Create: `frontend/src/features/patients/api/patientKeys.ts`
- Create: `frontend/src/features/patients/hooks/usePatientsQuery.ts`
- Create: `frontend/src/features/patients/hooks/usePatientsQuery.test.ts`

**Interfaces:**

- Consumes: `getPatients(filters: PatientFilters, page: number, pageSize: number):
  Promise<PatientPage>` from `../api/patientsApi`; `searchAllergens(search: string):
  Promise<AllergenOption[]>` from `../api/allergensApi`; `getDashboardStats():
  Promise<DashboardStats>` from `../api/statsApi`; `QueryWrapper` from `@/test/renderWithQuery`.
- Produces: `patientKeys` with `.all`, `.list(filters, page, pageSize)` and `.detail(id)`;
  `useAllergenByName(allergenName: string | undefined): { allergen: AllergenOption | null; isPending:
  boolean }`; `usePatientsQuery(filters: PatientFilters, page: number, pageSize: number, enabled:
  boolean)`; `useDashboardStats()`. The latter two return standard Query results.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/features/patients/hooks/usePatientsQuery.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as allergensApi from '../api/allergensApi'
import { patientKeys } from '../api/patientKeys'
import { useAllergenByName } from './usePatientsQuery'

beforeEach(() => {
  vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([{ id: 'a1', name: 'Pollen' }])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('patientKeys', () => {
  it('prefixes lists and details so one invalidation clears both', () => {
    expect(patientKeys.list({}, 1, 10).slice(0, 1)).toEqual(patientKeys.all)
    expect(patientKeys.detail('p1').slice(0, 1)).toEqual(patientKeys.all)
  })

  it('distinguishes different filters', () => {
    expect(patientKeys.list({ species: 'dog' }, 1, 10)).not.toEqual(
      patientKeys.list({ species: 'cat' }, 1, 10),
    )
  })
})

describe('useAllergenByName', () => {
  it('resolves a matching name to its option', async () => {
    const { result } = renderHook(() => useAllergenByName('Pollen'), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.allergen).toEqual({ id: 'a1', name: 'Pollen' })
  })

  it('stops pending when the name matches nothing', async () => {
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])

    const { result } = renderHook(() => useAllergenByName('Nonexistent'), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.allergen).toBeNull()
  })

  it('stops pending when the lookup fails', async () => {
    vi.spyOn(allergensApi, 'searchAllergens').mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useAllergenByName('Pollen'), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.allergen).toBeNull()
  })

  it('is neither pending nor fetching without a name', () => {
    const { result } = renderHook(() => useAllergenByName(undefined), { wrapper: QueryWrapper })

    expect(result.current.isPending).toBe(false)
    expect(result.current.allergen).toBeNull()
    expect(allergensApi.searchAllergens).not.toHaveBeenCalled()
  })
})
```

The second and third tests are the regression guard. The original bug was that "still resolving"
was inferred from the result, so a name matching nothing looked identical to one still in flight
and the table froze on a permanent skeleton.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- usePatientsQuery`
Expected: FAIL — cannot resolve `../api/patientKeys` or `./usePatientsQuery`.

- [ ] **Step 3: Create the key factory**

Create `frontend/src/features/patients/api/patientKeys.ts`:

```ts
import type { PatientFilters } from '../types'

export const patientKeys = {
  all: ['patients'] as const,
  list: (filters: PatientFilters, page: number, pageSize: number) =>
    [...patientKeys.all, 'list', filters, page, pageSize] as const,
  detail: (id: string) => [...patientKeys.all, 'detail', id] as const,
}
```

The filters object goes into the key directly. Query hashes keys structurally, which is what
replaces the hand-built `JSON.stringify` cache key.

- [ ] **Step 4: Create the hooks**

Create `frontend/src/features/patients/hooks/usePatientsQuery.ts`:

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchAllergens } from '../api/allergensApi'
import { patientKeys } from '../api/patientKeys'
import { getPatients } from '../api/patientsApi'
import { getDashboardStats } from '../api/statsApi'
import type { AllergenOption, PatientFilters } from '../types'

export interface AllergenResolution {
  allergen: AllergenOption | null
  isPending: boolean
}

export function useAllergenByName(allergenName: string | undefined): AllergenResolution {
  const name = allergenName ?? ''

  const { data, isPending } = useQuery({
    queryKey: ['allergens', 'byName', name],
    queryFn: () => searchAllergens(name),
    enabled: name.length > 0,
    select: (results) =>
      results.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase()) ?? null,
  })

  if (name.length === 0) {
    return { allergen: null, isPending: false }
  }

  return { allergen: data ?? null, isPending }
}

export function usePatientsQuery(
  filters: PatientFilters,
  page: number,
  pageSize: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: patientKeys.list(filters, page, pageSize),
    queryFn: () => getPatients(filters, page, pageSize),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: getDashboardStats,
  })
}
```

`isPending` comes from the query's own lifecycle, so it goes false when the request settles whether
or not a match was found — including on rejection, which is why the failure test passes without
extra handling.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- usePatientsQuery`
Expected: PASS, 6 tests.

Run: `npx tsc -b`
Expected: no output.

---

### Task 4: Convert PatientsPage

**Files:**

- Modify: `frontend/src/features/patients/pages/PatientsPage.tsx`
- Modify: `frontend/src/features/patients/pages/PatientsPage.test.tsx`

**Interfaces:**

- Consumes: `useAllergenByName`, `usePatientsQuery`, `useDashboardStats` from
  `../hooks/usePatientsQuery`; `patientKeys` from `../api/patientKeys`; `getPatient(id: string):
  Promise<PatientDetail>` and `deletePatient(id: string): Promise<void>` from `../api/patientsApi`;
  `QueryWrapper` from `@/test/renderWithQuery`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the wrapper and the regression test to the page tests**

In `frontend/src/features/patients/pages/PatientsPage.test.tsx`, add the import:

```tsx
import { QueryWrapper } from '@/test/renderWithQuery'
```

and change `renderAt` (currently at line 27) to nest the provider outermost:

```tsx
function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/patients', element: <PatientsPage /> }], {
    initialEntries: [path],
  })

  return render(
    <QueryWrapper>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryWrapper>,
  )
}
```

Then add this test to the `PatientsPage URL state` describe block:

```tsx
it('still renders rows when the URL allergen matches nothing', async () => {
  vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])

  renderAt('/patients?allergen=Nonexistent')

  expect(await screen.findByText('Rex')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the tests**

Run: `npm run test -- PatientsPage`
Expected: all pass, the new test included.

This one is a regression guard, not a red-first test. The frozen-table bug it describes was already
fixed by the `{ name, option }` reshaping in the previous change, so the test passes before and
after. Its value is that it keeps passing once the resolution moves into `useQuery`.

- [ ] **Step 3: Replace the imports at the top of PatientsPage**

In `frontend/src/features/patients/pages/PatientsPage.tsx`, replace lines 1–22 with:

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '@/shared/lib/apiClient'
import { Button, useToast } from '@/shared/ui'
import { PatientDetailPanel } from '../components/PatientDetailPanel'
import { PatientFilters } from '../components/PatientFilters'
import { PatientFormPanel } from '../components/PatientFormPanel'
import { PatientTable } from '../components/PatientTable'
import { PeakHoursPanel } from '../components/PeakHoursPanel'
import { StatCards } from '../components/StatCards'
import { patientKeys } from '../api/patientKeys'
import { deletePatient, getPatient } from '../api/patientsApi'
import { useAllergenByName, useDashboardStats, usePatientsQuery } from '../hooks/usePatientsQuery'
import { parseFilterParams, toFilterParams } from '../lib/patientFilterParams'
import type {
  PatientDetail,
  PatientFilters as PatientFiltersType,
  PatientListItem,
  PatientPage,
} from '../types'
import styles from './PatientsPage.module.css'
```

Gone: `useRef`, `getPatients` (the hook calls it now), `searchAllergens`, `getDashboardStats`,
and the `AllergenOption` and `DashboardStats` types. `PatientPage` stays — `EMPTY_PAGE` is typed
with it.

- [ ] **Step 4: Replace the data section of the component**

Replace everything from `const [allergenResolution` (line 37) through `useEffect(loadPatients,
[loadPatients])` and the stats effect (line 124) with:

```tsx
const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })
const [displayPanel, setDisplayPanel] = useState<PanelState>({ mode: 'closed' })
if (panel.mode !== 'closed' && panel !== displayPanel) {
  setDisplayPanel(panel)
}
const [peakHoursOpen, setPeakHoursOpen] = useState(false)

const queryClient = useQueryClient()
const { allergen, isPending: isAllergenPending } = useAllergenByName(allergenName)
const activeFilters: PatientFiltersType = { ...filters, allergen }

const patientsQuery = usePatientsQuery(activeFilters, page, pageSize, !isAllergenPending)
const statsQuery = useDashboardStats()
const patientPage = patientsQuery.data ?? EMPTY_PAGE

const writeParams = useCallback(
  (nextFilters: PatientFiltersType, nextPage: number, nextPageSize: number) => {
    setSearchParams(toFilterParams(nextFilters, nextPage, nextPageSize), { replace: true })
  },
  [setSearchParams],
)

useEffect(() => {
  if (patientsQuery.isError) {
    showToast({ tone: 'error', title: 'Could not load patients' })
  }
}, [patientsQuery.isError, showToast])
```

The `panel` / `displayPanel` block and `peakHoursOpen` are unchanged from the original — they move
up only because the state they used to sit beside is gone.

- [ ] **Step 5: Replace the write and open handlers**

Replace `afterWrite` and `openPatient` (lines 146–160 of the original) with:

```tsx
const afterWrite = (title: string) => {
  closePanel()
  queryClient.invalidateQueries({ queryKey: patientKeys.all })
  queryClient.invalidateQueries({ queryKey: ['stats'] })
  showToast({ tone: 'success', title })
}

const openPatient = (patient: PatientListItem) => {
  queryClient
    .query({
      queryKey: patientKeys.detail(patient.id),
      queryFn: () => getPatient(patient.id),
    })
    .then((detail) => setPanel({ mode: 'view', patient: detail }))
    .catch(() => {
      showToast({ tone: 'error', title: 'Could not open that patient' })
      queryClient.invalidateQueries({ queryKey: patientKeys.all })
    })
}
```

Invalidating `patientKeys.all` also clears cached details, because keys match by prefix.

`handleDelete` keeps its body exactly as it is, including the `Patients.NotFound` /
`Patients.AlreadyDeleted` forgiveness. Do not change it.

- [ ] **Step 6: Route the deep-link effect through the cache**

In the `?patient=` effect (lines 126–142 of the original), replace the bare `getPatient` call.
Use `query`, not `fetchQuery` — the latter is deprecated as of query-core 5.102.8 and takes the
same options:

```tsx
queryClient
  .query({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => getPatient(patientId),
  })
  .then((patient) => setPanel({ mode: 'view', patient }))
  .catch(() => undefined)
```

Add `queryClient` to that effect's dependency array.

- [ ] **Step 7: Update the two props that read the old state**

In the JSX, `StatCards` becomes:

```tsx
<StatCards
  stats={statsQuery.data ?? null}
  isLoading={statsQuery.isPending}
  onPeakHoursClick={() => setPeakHoursOpen(true)}
/>
```

and `PatientTable`'s loading prop becomes:

```tsx
isLoading={patientsQuery.isLoading || isAllergenPending}
```

Keep `|| isAllergenPending`. A query disabled by `enabled: false` reports `isLoading: false`, so
without it the table would render an empty state rather than a skeleton while the allergen
resolves.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm run test -- PatientsPage`
Expected: PASS, including the new regression test.

If a test asserting the error toast now fails, it is because the toast moved from a `.catch` into
an effect — the assertion needs `await screen.findByText(...)` rather than a synchronous check.

---

### Task 5: Full verification

**Files:** none modified unless a check fails.

- [ ] **Step 1: Run the whole suite**

Run: `npm run test`
Expected: PASS. 139 original + 3 (Task 1) + 1 (Task 2) + 6 (Task 3) + 1 (Task 4) = 150 tests.

- [ ] **Step 2: Typecheck and build**

Run: `npx tsc -b`
Expected: no output.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Lint and format**

Run: `npm run lint`
Expected: clean apart from the one pre-existing warning in `AuthContext.tsx`, which is not in scope.

Run: `npx prettier --check .`
Expected: clean. If not, run `npm run format` and re-run the suite.

- [ ] **Step 4: Confirm the deletions actually happened**

Search `PatientsPage.tsx` and `useEntitySearch.ts` for `latestRequest`, `searchKey`, `refreshStats`,
`loadPatients` and `eslint-disable`.
Expected: no matches in either file. Any hit means dead code was left behind.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`

Check, in order:

1. `/patients` loads rows and stat cards.
2. Applying a filter updates the URL and the table.
3. Paging keeps the previous rows visible instead of flashing the skeleton.
4. Navigating to Appointments and back shows the table instantly with no skeleton.
5. Pasting a URL with `?allergen=` naming a nonexistent allergen still renders the table.
6. Create, edit and delete each refresh the table and the stat cards.
7. The devtools panel is present and shows the cached queries.

Then stop the dev server and delete any screenshots or scratch files produced during the check.

---

## Notes for the executor

- Do not commit. The repo owner commits their own work.
- Do not add code comments.
- If a call-count assertion changes because two components now share a query key, that is the
  deduplication working. Adjust the expectation; do not give the components different keys to make
  the old number come back.
