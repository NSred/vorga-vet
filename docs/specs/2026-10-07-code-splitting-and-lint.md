# Route-level code splitting and a clean lint run

Status: Implemented. Follows the [de-duplication](2026-10-07-frontend-dedup.md) document. The
shared-code changes are also listed in the app-wide table of the
[hardening document](2026-09-21-frontend-hardening-before-scheduling.md).

## What this adds

The app opens faster. Before, every visit downloaded the whole app as one 732 kB script (221 kB
compressed), including the vet-only screens a client never sees. Now:

- The first load downloads 353 kB (110 kB compressed), half of before. Each page's code arrives
  the first time that page opens.
- A client never downloads the price list, lists, reminders, reports or the vet calendar.
- The header and navigation stay on screen while a page loads for the first time.
- A tab left open across a deploy, whose old page files are gone, offers a reload instead of a
  broken screen.
- `npm run lint` reports nothing; the four fast-refresh warnings are gone.

Not in this document: prefetching pages before they are opened, a separate vendor chunk, and
splitting the 498-line `AppointmentFormPanel`, which is a readability refactor for its own
document.

## Backend contract

None. No endpoint changes. The only server involved is the frontend's nginx: it serves `/assets/`
with a one-year cache and answers a missing file with 404, which is why a stale tab needs the
reload described under Design.

## Design

**Where the bytes are.** A measurement build on 2026-10-07 put each library and app folder in its
own chunk. React, React DOM, the router and TanStack Query are about 99 kB compressed and every page
needs them; that is the floor. Radix and its helpers are about 40 kB and the feature code about
95 kB, roughly half of it vet-only. Those two are what splitting defers.

**Lazy pages with `React.lazy`.** Every page is its own chunk, declared once in `app/lazyPages.ts`
and used by `routes.tsx`. The layouts and guards (`AuthLayout`, `AppLayout`, `ProtectedRoute`,
`RoleRoute`) stay in the first load because every route renders them. `NotFoundPage` and
`RouteErrorPage` stay too: the error page must work when a page chunk fails to load. React
Router's own route `lazy` was the alternative, but `/appointments` picks the vet or client page by
role at render time, which a route-level loader cannot do; `AppointmentsRoute` renders one of two
lazy pages instead. One mechanism serves both cases. React Router runs navigations as transitions,
so the current page stays on screen until the next one is ready.

**Loading state.** `AppLayout` and `AuthLayout` wrap their `Outlet` in `Suspense`. The app layout
shows a page-sized `Skeleton` under the header; the auth layout shows nothing in the card until the
form arrives. Because navigations are transitions, the skeleton shows only when a page is opened
straight from the address bar or a reload.

**Source marked side-effect free.** Lazy pages alone cut the first load only to 150 kB compressed.
Every shared component imports its CSS, which the bundler treats as a side effect, so importing the
`@/shared/ui` barrel from the shell pulled every shared component, Radix and `date-fns` into the
first load. `package.json` declares that only CSS files have side effects; unused barrel exports
then drop out, with their CSS. No source file runs code at import time for its effect (checked
2026-10-07: the only bare import is the test setup). CSS is split per chunk as a result, so page
styles load after the shell's, as they did in the single file.

**No manual vendor chunk.** Forcing all libraries into one chunk would pull page-only libraries
(the form library, `date-fns`, Radix Select and Popover) back into the first load. Rolldown's
default chunking already shares modules between page chunks.

**Stale chunks after a deploy.** A lazy page whose file no longer exists fails to import, and the
route's error element catches it. `RouteErrorPage` recognises a failed module import, with Chrome,
Firefox and Safari each wording it differently, and says the app was updated, with a Reload
button. Any other error keeps the old message.

**Lint.** The four warnings came from `react/only-export-components`: React's fast refresh cannot
update a file that exports both a component and something else. `patientLabel` moved from
`PatientPicker.tsx` into `features/patients/lib`, and the auth context with `useAuth` moved out of
`AuthContext.tsx`, which now holds only `AuthProvider`. The test helper
`src/test/renderWithQuery.tsx` keeps its shape: fast refresh never runs in tests, so
`.oxlintrc.json` turns the rule off for `src/test/**` rather than splitting a helper that 51 tests
import.

## Tasks

- [x] **Lazy pages and loading states**: pages lazy through `app/lazyPages.ts`, `Suspense` with a
      skeleton in both layouts. Tests prove the role switch loads the vet or the client page and
      that the header stays while a page is still loading.
- [x] **Side-effect-free source**: `sideEffects` in `package.json`. The production build shows
      353 kB raw and 110 kB compressed on first load, 45 chunks and no chunk-size warning.
- [x] **Reload after a deploy**: `RouteErrorPage` handles a failed page import. Tests prove the
      update message and reload for an import error and the old message for any other error.
- [x] **Lint warnings**: `patientLabel` and `useAuth` in their own files, test helpers exempt.
      `npm run lint` reports nothing; auth and party-field tests pass with the new paths.
- [x] **Checks**: tests, types, lint and build sizes; the Docker image rebuilt; every page opened
      on the production build as the vet (phone and desktop) and the client (phone), and a 404 on
      the reports chunk showed the update screen.

## Where it lives

```
frontend/
  package.json                                  + sideEffects: only CSS files
  .oxlintrc.json                                + fast-refresh rule off for src/test/**
  src/app/lazyPages.ts                          every page as a lazy component
  src/app/routes.tsx                            pages from lazyPages; error and 404 pages static
  src/app/AppointmentsRoute.tsx                 the vet or client page by role, both lazy
  src/app/layout/AppLayout.tsx                  + Suspense with a skeleton under the header
  src/features/auth/components/AuthLayout.tsx   + Suspense around the form
  src/features/auth/context/useAuth.ts          auth context, its types and useAuth
  src/features/auth/context/AuthContext.tsx     AuthProvider only
  src/features/patients/lib/patientLabel.ts     "patient · owner" label for pickers
  src/pages/RouteErrorPage.tsx                  + update screen for a failed page load
  src/shared/lib/reloadPage.ts                  reloads the page
```

Moved: `useAuth` and the auth context out of `AuthContext.tsx`, and `patientLabel` out of
`PatientPicker.tsx`; both are still exported from their feature's `index.ts`.

## Notes from implementation

- **Lazy constants trip the same lint rule.** `lazy(...)` results count as components, so declaring
  them in `routes.tsx`, which exports the router, raised seven new warnings. They live in
  `app/lazyPages.ts`, which exports nothing else.
- **jsdom 30 locks `location.reload`.** It is non-configurable, so a test cannot spy on it or
  replace `window.location`. The error page calls `reloadPage` from `shared/lib`, which the test
  mocks.
