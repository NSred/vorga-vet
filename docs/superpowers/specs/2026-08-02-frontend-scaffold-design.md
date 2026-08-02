# VorgaVet Frontend — Initial Scaffold & Auth Feature

## Context

`frontend/` is currently empty (README only). The backend (`backend/`) is a .NET 10
Clean Architecture API with JWT + refresh-token auth, running locally at
`http://localhost:5000` (Docker) with no `/api` version prefix. This spec covers
standing up the frontend project structure and one real, working feature — auth —
so the user can verify the frontend can talk to the backend.

## Goals

- A feature-folder React + TypeScript architecture that scales as more domain
  features (patients, appointments, etc.) are added later.
- A working login/register flow against the real backend, to validate connectivity.
- Minimal dependencies — nothing added that isn't earning its place yet.

## Non-goals (explicitly out of scope for this pass)

- Any domain feature beyond auth (patients, appointments, clinical records, ...).
- TanStack Query / any server-state library — plain fetch + Context for now.
- A component library (MUI, Mantine, etc.) — Tailwind utility classes only.
- Docker packaging for the frontend.
- CORS configuration on the backend — **the user owns this** (see Risks).

## Stack

| Concern | Choice |
|---|---|
| Build tool | Vite |
| Language | TypeScript (strict mode) |
| UI framework | React |
| Routing | React Router |
| Styling | Tailwind CSS |
| Server/auth state | Plain `fetch` wrapper + React Context (no query library yet) |
| Package manager | npm |
| Linting/formatting | ESLint (flat config) + Prettier |
| Testing | Vitest + React Testing Library (config wired, no feature tests yet) |

## Folder structure

```
frontend/
├── src/
│   ├── app/                      # Composition root: routing, layout, providers wiring
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── layout/                # AppLayout, Sidebar, Header
│   ├── features/                  # One folder per business domain
│   │   └── auth/                  # Only feature scaffolded in this pass
│   │       ├── api/                # authApi.ts — login/register/refreshToken calls
│   │       ├── components/         # LoginPage.tsx, RegisterPage.tsx
│   │       ├── context/             # AuthContext.tsx — AuthProvider + useAuth()
│   │       ├── routes/               # ProtectedRoute.tsx
│   │       ├── types.ts
│   │       └── index.ts              # Public exports; nothing outside imports internals directly
│   ├── shared/                     # Cross-feature, no business meaning
│   │   ├── components/              # Generic UI primitives (Button, Input, ...)
│   │   ├── lib/                      # apiClient.ts — fetch wrapper (base URL, auth header, 401 refresh-retry)
│   │   └── config/                    # env.ts — typed wrapper around import.meta.env
│   └── main.tsx                     # Vite entry point
├── public/
├── index.html
├── vite.config.ts                   # includes "@/" -> "src/" path alias
├── tsconfig.json
├── tailwind.config.ts
├── eslint.config.js
├── .env.example                      # VITE_API_BASE_URL=http://localhost:5000
└── package.json
```

`features/*` are self-contained and expose only `index.ts`. `shared/` holds
generic reusable code; `features/` holds business-domain code. `app/` only
assembles the two — it has no business logic of its own.

Config files (`vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`,
`eslint.config.js`) stay at the frontend project root because the tooling
looks for them there by default.

## Auth feature — backend contract

No `/api` prefix; no cookies anywhere; both tokens are plain JSON strings the
frontend stores and resends itself.

| Endpoint | Method | Request body | Response body |
|---|---|---|---|
| `/users/login` | POST | `{ email, password }` | `{ accessToken, refreshToken }` |
| `/users/register` | POST | `{ email, firstName, lastName, password }` | bare GUID string (no auto-login) |
| `/users/refresh-token` | POST | `{ refreshToken }` | `{ accessToken, refreshToken }` (rotated — old token invalidated) |

- Authenticated requests: `Authorization: Bearer <accessToken>`.
- Access token expires in 60 min (dev config); refresh token in 7 days.
- No "current user" endpoint exists. The frontend decodes the JWT payload
  client-side (base64 decode, no library) to read claims (email, user id) for
  display purposes.

## Auth feature — frontend flow

- **Token storage**: `localStorage`, for both `accessToken` and `refreshToken`.
  Simplest option given the backend has no cookie support; the XSS trade-off
  vs. httpOnly cookies is accepted for now and can be revisited if the backend
  adds cookie-based auth later.
- **`shared/lib/apiClient.ts`**: wraps `fetch`, reads `VITE_API_BASE_URL` from
  env, attaches the `Authorization` header when an access token is present. On
  a `401` response, it calls `/users/refresh-token` once, persists the rotated
  tokens, and retries the original request once. If refresh also fails, it
  clears stored tokens and the app redirects to `/login`.
- **`AuthContext`**: owns the tokens, the decoded claims, and exposes
  `login()`, `register()`, `logout()`, `isAuthenticated`.
- **Routes**: `/login` and `/register` are public; `/` (placeholder Dashboard
  page) is wrapped in `ProtectedRoute`, which redirects to `/login` when not
  authenticated.
- **Validation**: plain HTML5 form validation (`required`, `type="email"`,
  `minLength=8` to mirror the backend's password rule). No form library yet —
  not justified until forms get more complex.
- **Errors**: failed login/register requests show the backend's ProblemDetails
  `title`/`detail` text inline on the form.

## Risks / follow-ups

- **CORS**: the backend currently has no CORS policy configured anywhere
  (`Program.cs` has no `AddCors`/`UseCors`). Browser requests from the Vite dev
  server (`http://localhost:5173`) to `http://localhost:5000` will be blocked
  until this is added. The user will handle this on the backend themselves —
  it is not part of this frontend work.
- Revisit token storage (httpOnly cookies) if/when the backend adds cookie
  support.
- Revisit adding TanStack Query once a second feature needs real server-state
  caching (lists, pagination, mutations with optimistic updates).
