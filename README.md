# VorgaVet

VorgaVet is organized as a monorepo so the API, web application, and deployment
configuration can evolve together.

## Repository structure

- `backend/` — .NET backend, tests, and backend-only Docker Compose services
- `frontend/` — React and TypeScript web application
- `compose.yml` — complete local application stack
- `devops/` — deployment and infrastructure configuration
- `.github/workflows/` — GitHub Actions pipelines

## Run the complete application with Docker

From the repository root:

```bash
docker compose up --build -d
```

The services are then available at:

- Frontend: http://localhost:5173
- API and Swagger: http://localhost:5000/swagger
- API health check: http://localhost:5000/health
- pgAdmin: http://localhost:5050
- Seq: http://localhost:8081

Stop the stack without deleting its database volumes:

```bash
docker compose down
```

## Backend only

The existing backend Compose configuration remains available:

```bash
cd backend
docker compose up --build -d
```

Run the backend test suite from the repository root with:

```bash
dotnet test backend/VorgaVet.slnx
```

See [`backend/README.md`](backend/README.md) for details about the backend architecture.
