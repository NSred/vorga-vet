# Frontend scaffold and auth — implementation record

Status: implemented 2026-08-02. Design in
`docs/superpowers/specs/2026-08-02-frontend-scaffold-design.md`.

Originally a step-by-step plan with full code inline. The code is in the repository now, so
that detail has been removed and only the decisions remain.

## What was built

The initial Vite + React + TypeScript frontend, with a login and register flow working against
the real backend so connectivity could be proven end to end.

The layout convention set here still holds:

- `src/app` is the composition root: routing, layout, provider wiring.
- `src/features/<name>` are self-contained slices exposing only `index.ts`.
- `src/shared` holds cross-feature infrastructure with no business meaning: API client, token
  storage, env config.

Built in five passes: project scaffolding, shared infrastructure, the auth feature (types, API,
context, protected route), the login and register pages, then routing and wiring.

## Decisions worth knowing

**CSS Modules, not Tailwind.** The plan started on Tailwind and switched during the first task.
Every component since uses a colocated `ComponentName.module.css` and a `styles.foo` reference.

**`react-router`, not `react-router-dom`.** `react-router-dom@7.18.2` fell inside the
vulnerable range for GHSA-qwww-vcr4-c8h2 (an RSC-mode CSRF bypass, not reachable from plain
client-side routing, but worth fixing properly). The `-dom` package was discontinued after
7.18.2; from v8 the plain `react-router` package exports everything directly. Switched to
`react-router@^8.3.0`.

**No test framework.** A deliberate choice at the time. Vitest and Testing Library were added
later, on 2026-08-26.

## Stale references

This plan predates commit `13e205f`, which translated the UI to English. Any Serbian text or
`kartoteka`/`zakazano` naming in older docs refers to what are now `patients` and
`appointments`.
