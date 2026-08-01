# VorgaVet

VorgaVet is organized as a monorepo so the API, web application, and deployment
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
docker compose up --build -d
```

Swagger is then available at http://localhost:5000/swagger, pgAdmin at
http://localhost:5050, and Seq at http://localhost:8081.

Run the backend test suite with:

```bash
dotnet test backend/VorgaVet.slnx
```

See [`backend/README.md`](backend/README.md) for details about the current backend
template and its architecture.
