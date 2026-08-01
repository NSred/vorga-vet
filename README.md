# Vorga Vet

Vorga Vet is organized as a monorepo so the API, web application, and deployment
configuration can evolve together.

## Repository structure

- `backend/` — .NET backend, tests, and local Docker Compose services
- `frontend/` — frontend application (to be added)
- `devops/` — deployment and infrastructure configuration (to be added)
- `.github/workflows/` — GitHub Actions pipelines

## Backend

From the repository root:

```bash
cd backend
docker compose up -d
dotnet run --project src/Web.Api
```

Run the backend test suite with:

```bash
dotnet test backend/CleanArchitecture.slnx
```

See [`backend/README.md`](backend/README.md) for details about the current backend
template and its architecture.
