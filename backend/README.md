# VorgaVet Backend

The VorgaVet backend is a **.NET 10** API organized using Clean Architecture.

## Architecture and capabilities

- **SharedKernel** project with common Domain-Driven Design abstractions.
- **Domain** layer with sample entities and domain events.
- **Application** layer with abstractions for:
  - CQRS (lightweight, MediatR-free command/query handlers)
  - Example use cases (Todos and Users)
  - Cross-cutting concerns (logging, validation) implemented as decorators
- **Infrastructure** layer with:
  - JWT authentication with **refresh tokens** (with token rotation)
  - Permission-based authorization
  - EF Core + PostgreSQL (snake_case naming, migrations)
  - **HybridCache** for fast, unified caching with cache invalidation
  - Serilog structured logging
- **Web.Api** layer with:
  - Minimal API endpoints
  - **Rate limiting** (configurable global + authentication policies)
  - **OpenTelemetry** tracing and metrics (ASP.NET Core, HTTP, Npgsql, runtime)
  - Global exception handling and `ProblemDetails`
  - Swagger / OpenAPI with JWT support
- **Seq** for searching and analyzing structured logs
  - Seq is available at http://localhost:8081 by default
- **Testing** projects
  - Architecture testing (`ArchitectureTests`)
  - Unit testing (`Application.UnitTests`)
  - Integration testing with **Testcontainers** (`IntegrationTests`)

## Getting started

```bash
docker compose up --build -d
```

This starts the complete local backend stack:

- API and Swagger: http://localhost:5000/swagger
- API health check: http://localhost:5000/health
- PostgreSQL: `localhost:5432` (database `vorga-vet`, user/password `postgres`)
- pgAdmin: http://localhost:5050
- Seq: http://localhost:8081

Sign in to pgAdmin with `admin@vorgavet.com` / `vorgavet`. The
`VorgaVet PostgreSQL` server is registered automatically; enter `postgres` when
pgAdmin asks for its database password. The pgAdmin credentials can be overridden
with `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` in a local `.env` file.

To run the API from Rider instead, start the supporting services with
`docker compose up -d postgres pgadmin seq`, then run the `http` launch profile. The local
development connection string uses `localhost`; the container receives an override
that uses Docker's internal `postgres` service hostname.

Run the full test suite (the integration tests spin up a throwaway PostgreSQL container, so
Docker must be running):

```bash
dotnet test VorgaVet.slnx
```

To target .NET 8 or .NET 9 instead of .NET 10, see the notes in `Directory.Build.props`.

The original backend foundation was based on Milan Jovanovic's
[**Pragmatic Clean Architecture**](https://www.milanjovanovic.tech/pragmatic-clean-architecture?utm_source=ca-template)
template, covering topics such as:

- Domain-Driven Design
- Role-based authorization
- Permission-based authorization
- Distributed caching with Redis
- OpenTelemetry
- Outbox pattern
- API Versioning
- Unit testing
- Functional testing
- Integration testing
