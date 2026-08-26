---
name: add-feature
description: Scaffold a complete Clean Architecture feature slice for the VorgaVet backend — command or query, custom handler, FluentValidation validator, minimal API endpoint, and tests (unit, validator, integration). Use when the user asks to add a feature, use case, command, query, or endpoint.
argument-hint: <feature description, e.g. "archive a todo item" or "get todos due this week">
---

# Add a Feature (Vertical Slice)

Scaffold a full use case following this template's conventions: an Application-layer use case with a custom command/query handler, a Web.Api minimal-API endpoint, and tests. No MediatR — this codebase uses its own `ICommand`/`IQuery` abstractions with Scrutor-registered handlers and decorators.

## Workflow

1. **Classify the use case.** A state change is a **command**; a read is a **query**. Derive names from the existing pattern: use case verb + entity, e.g. `ArchiveTodoCommand`, `GetOverdueTodosQuery`.
2. **Check the Domain layer.** If the entity, its `{Entity}Errors` class, or a needed domain event doesn't exist, add it first (see the `add-entity` skill). Commands that change state should raise a domain event via `entity.Raise(...)`.
3. **Create the Application slice** in `backend/src/Application/{Feature}/{UseCase}/` — command/query, handler, validator (commands only), response DTO (queries only). Templates: [references/command-slice.md](references/command-slice.md) and [references/query-slice.md](references/query-slice.md).
4. **Create the endpoint** in `backend/src/Web.Api/Endpoints/{Feature}/{UseCase}.cs`. Template: [references/endpoint.md](references/endpoint.md).
5. **Write tests** — handler unit tests, validator tests, and an integration test. Templates: [references/tests.md](references/tests.md).
6. **Readability pass, before verifying.** If the handler has more than one distinct concern — several optional filters, a multi-step pipeline, a secondary enrichment query, anything that wouldn't fit in one screenful read top-to-bottom — decompose it into small, well-named private methods so `Handle` itself reads as a short narrative, not the full implementation. Don't apply this to simple handlers (most `Create`/`Update`/single-entity `Get` slices are 3-10 lines and already read fine as one block) — decompose because a handler is genuinely multi-phase, not by default regardless of size. See `references/query-slice.md`'s "Multi-entity queries" section for the concrete pattern and a real EF Core translation trap to avoid when doing this.
7. **Verify:** `dotnet build` then `dotnet test`. All three test projects must pass, including `ArchitectureTests` (layer dependency rules). Re-run this after the readability pass too — restructuring a query is exactly the kind of change that can silently break EF Core's translation of it; verify, don't assume the refactor is behavior-preserving just because it compiles.

## Non-negotiable conventions

- **Folder = use case.** One folder per use case under `backend/src/Application/{Feature}/` (e.g. `Todos/Archive/`), containing all files for that slice.
- **Handlers are `internal sealed`** with primary constructors, implementing `ICommandHandler<TCommand>`, `ICommandHandler<TCommand, TResponse>`, or `IQueryHandler<TQuery, TResponse>`.
- **No manual DI registration.** Handlers, validators, and endpoints are discovered by assembly scanning (`Scrutor`, `AddValidatorsFromAssembly`, `AddEndpoints`). Never touch `DependencyInjection.cs` for a new slice.
- **Return `Result` / `Result<T>`, never throw** for expected failures. Errors come from static factory methods on `{Entity}Errors` in the Domain layer with codes like `"Todos.NotFound"`.
- **Validation lives in a `{Command}Validator`** (FluentValidation). It runs automatically via `ValidationDecorator` — the handler never validates input shape itself. Queries have no validators (the decorator only wraps commands).
- **Data access via `IApplicationDbContext`** (from `Application.Abstractions.Data`) — never reference Infrastructure from Application.
- **Authorization check** in handlers that act on user-owned data: compare `IUserContext.UserId` and return `UserErrors.Unauthorized()` on mismatch, or filter queries by `userContext.UserId`.
- **Queries project directly to a `{X}Response` DTO** with `.Select(...)` — never return domain entities. Cache hot reads with `HybridCache` using a `{Feature}CacheKeys` static class; invalidate in the commands that mutate the cached data.
- **Endpoints** implement `IEndpoint`, resolve the handler interface directly from DI, use `result.Match(Results.Ok, CustomResults.Problem)` (or `Results.NoContent` for void commands), tag with the `Tags` class, and call `.RequireAuthorization()`.

## Naming reference

| Artifact | Pattern | Example |
|---|---|---|
| Command | `{Verb}{Entity}Command` | `ArchiveTodoCommand` |
| Query | `Get{X}Query` | `GetOverdueTodosQuery` |
| Handler | `{Command/Query}Handler` | `ArchiveTodoCommandHandler` |
| Validator | `{Command}Validator` | `ArchiveTodoCommandValidator` |
| Response | `{X}Response` | `TodoResponse` |
| Endpoint | `{UseCase}.cs` in `Endpoints/{Feature}/` | `Endpoints/Todos/Archive.cs` |
| Unit test | `{Handler}Tests` | `ArchiveTodoCommandHandlerTests` |
| Test method | `Handle_Should_{Outcome}_When{Condition}` | `Handle_Should_ReturnNotFound_WhenTodoDoesNotExist` |
