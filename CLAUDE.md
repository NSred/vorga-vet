# VorgaVet — working notes for Claude

Veterinary clinic application: a .NET backend and a React frontend in one repository. The UI is in
English; some older documents use the Serbian tab names from the original mockup (Kartoteka =
Patient Records, Zakazano = Appointments).

## Where things are

| Path | What |
|---|---|
| `backend/src/Domain` | Entities, enums, errors, domain events |
| `backend/src/Application` | Use cases as slices: command/query + handler + validator |
| `backend/src/Infrastructure` | EF Core configurations, migrations, authentication, storage |
| `backend/src/Web.Api/Endpoints` | Minimal API endpoints, one class per endpoint |
| `backend/tests` | `UnitTests`, `IntegrationTests` (Testcontainers), `ArchitectureTests` |
| `frontend/src` | Layers: `app -> pages -> widgets -> features -> shared` |
| `docs/` | Specs and plans — start at [docs/README.md](docs/README.md) |

## Commands

Frontend, run from `frontend/`:

```bash
npm run dev
npx vitest run
npx tsc -b
npm run lint
```

Backend, from the repository root:

```bash
dotnet test backend/VorgaVet.slnx
docker compose up -d --build web-api
```

The whole stack runs with `docker compose up -d`: frontend on 5173, API and Swagger on 5000,
pgAdmin on 5050, Seq on 8081. API configuration files are baked into its image, so a change to
`appsettings*.json` needs a rebuild of `web-api`.

## Conventions

**Backend** (see the `add-feature`, `add-entity` and `ca-review` skills): Clean Architecture with
one folder per use case; errors returned as `Result` with an `Error` from the entity's error
catalog, never thrown; FluentValidation validators per command; endpoints as `IEndpoint` classes
that only map a request to a command and match the result.

**Frontend:** layers import strictly downward and features never import other features — code
shared between two features moves into `widgets/` or is composed by a page. CSS Modules per
component; TanStack Query for server state with a key factory per feature; API DTOs converted to
domain types in a `lib/*Mapping.ts`.

**Roles:** `Client` and `Veterinarian`. The vet role comes only from
`Clinic:VeterinarianEmails` in the API configuration, applied at registration and at the next
login. Staff endpoints require the `Veterinarian` policy; clients see only their own data.

## Working agreements

- Write code without comments. The user adds their own where they are needed.
- Do not run `git commit` or `git push`. The user commits their own work.
- Feature work happens on a branch in this working tree, not in a separate worktree.
- Execute plans inline (the `executing-plans` skill), not through subagents.
- Delete temporary preview files and stop any local server as soon as a visual check is done.
- Every feature is one document in `docs/specs/`, written before the code and pruned when the code lands. The `feature-doc` skill owns that lifecycle: invoke it when planning and again to close. No separate design or plan file.
