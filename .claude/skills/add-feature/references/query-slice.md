# Query Slice Templates

Files go in `backend/src/Application/{Feature}/{UseCase}/`. Queries are reads: no validator, no domain events, no `SaveChangesAsync`.

## Query

```csharp
using Application.Abstractions.Messaging;

namespace Application.Todos.GetOverdue;

public sealed record GetOverdueTodosQuery : IQuery<List<TodoResponse>>;
```

With parameters: `public sealed record GetTodoByIdQuery(Guid TodoItemId) : IQuery<TodoResponse>;`

## Response DTO

Lives next to the query. Flat, serialization-friendly, never a domain entity.

```csharp
namespace Application.Todos.GetOverdue;

public sealed class TodoResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public List<string> Labels { get; set; } = [];
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
```

Each use-case folder owns its own `TodoResponse` — do not share DTOs across slices even if they look identical today.

## Handler

Scope to the current user, project with `.Select` straight into the DTO:

```csharp
using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Todos.GetOverdue;

internal sealed class GetOverdueTodosQueryHandler(
    IApplicationDbContext context,
    IUserContext userContext,
    IDateTimeProvider dateTimeProvider)
    : IQueryHandler<GetOverdueTodosQuery, List<TodoResponse>>
{
    public async Task<Result<List<TodoResponse>>> Handle(
        GetOverdueTodosQuery query,
        CancellationToken cancellationToken)
    {
        List<TodoResponse> todos = await context.TodoItems
            .Where(todoItem => todoItem.UserId == userContext.UserId &&
                               !todoItem.IsCompleted &&
                               todoItem.DueDate < dateTimeProvider.UtcNow)
            .Select(todoItem => new TodoResponse
            {
                Id = todoItem.Id,
                UserId = todoItem.UserId,
                Description = todoItem.Description,
                DueDate = todoItem.DueDate,
                Labels = todoItem.Labels,
                IsCompleted = todoItem.IsCompleted,
                CreatedAt = todoItem.CreatedAt,
                CompletedAt = todoItem.CompletedAt
            })
            .ToListAsync(cancellationToken);

        return todos;
    }
}
```

For single-item queries, return `Result.Failure<TodoResponse>(TodoItemErrors.NotFound(id))` when nothing matches.

## Case-insensitive substring search

For a "search by name/text" query (e.g. `SearchOwnersQuery`), there are two working options — pick one per project convention, don't mix:

**Option A — `EF.Functions.ILike`** (Npgsql's native case-insensitive match, what this project uses). Simpler code, no `.ToLower()`/analyzer suppression needed:
```csharp
ownersQuery = ownersQuery.Where(o =>
    EF.Functions.ILike(o.FirstName, $"%{term}%") ||
    EF.Functions.ILike(o.LastName, $"%{term}%"));
```
Requires a `PackageReference` to `Npgsql.EntityFrameworkCore.PostgreSQL` from the **Application** project — a deliberate, accepted exception to "never reference Infrastructure-specific concerns from Application," made because this project isn't expected to change database engines. Confirmed by actual runtime failure, not a guess: `ILike` throws `InvalidOperationException: ... switched to client-evaluation` against the in-memory provider, so **matching-behavior tests for this option must live in the integration tests (real Postgres via Testcontainers), not the handler unit tests.** Keep only provider-agnostic behavior (default ordering, result capping, no-term case) as unit tests; the rest goes in `{Feature}Tests` (integration).

**Option B — `EF.Functions.Like` + explicit `.ToLower()` on both sides** — provider-agnostic, no package needed, and (confirmed empirically) works against the in-memory provider too, so matching behavior *can* stay in fast handler unit tests:
```csharp
#pragma warning disable CA1304, CA1311 // plain ToLower() is required — see below
string term = query.SearchTerm.Trim().ToLower();
ownersQuery = ownersQuery.Where(o =>
    EF.Functions.Like(o.FirstName.ToLower(), $"%{term}%") ||
    EF.Functions.Like(o.LastName.ToLower(), $"%{term}%"));
#pragma warning restore CA1304, CA1311
```

Whichever option is used, avoid these — each fails with an actual runtime error, not just a style complaint:
- `.Contains(term, StringComparison.OrdinalIgnoreCase)` (CA1862's own suggested fix) throws `InvalidOperationException: could not be translated` against Npgsql.
- `.ToLowerInvariant()` / `.ToUpperInvariant()` (CA1304/CA1311's suggested fix for Option B's culture warning) also fail to translate on Npgsql — only the plain, culture-sensitive `.ToLower()` does. Suppress the two analyzers locally with a comment explaining why, rather than "fixing" it into something that breaks at runtime.

## Caching (optional, hot reads only)

Wrap the database query in `HybridCache.GetOrCreateAsync` with a key from the feature's cache-keys class (see `GetTodoByIdQueryHandler` for the live example):

```csharp
namespace Application.Todos;

internal static class TodoCacheKeys
{
    internal static string ById(Guid userId, Guid todoItemId) => $"todos-{userId}-{todoItemId}";
}
```

```csharp
TodoResponse? todo = await cache.GetOrCreateAsync(
    TodoCacheKeys.ById(userId, query.TodoItemId),
    async cancellation => await context.TodoItems
        .Where(...)
        .Select(...)
        .SingleOrDefaultAsync(cancellation),
    cancellationToken: cancellationToken);
```

Every command that mutates the cached data must invalidate the same key with `cache.RemoveAsync(...)`. If you can't enumerate the affected keys, don't cache.
