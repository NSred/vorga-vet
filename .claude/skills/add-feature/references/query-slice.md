# Query Slice Templates

Files go in `backend/src/Application/{Feature}/{UseCase}/`. Queries are reads: no validator, no domain events, no `SaveChangesAsync`.

## Multi-entity queries: filter on the plain entity type, join only at the final projection

No navigation properties exist anywhere in this domain, so a query spanning multiple entities (e.g. patients filtered by their owner's city, or their breed's species) needs explicit `join`s or correlated subqueries. **Do not project an intermediate `join` result into a named type (a `record`, a custom class) and then keep filtering/composing against it** — confirmed by an actual runtime failure, not a guess:

```
System.InvalidOperationException: The LINQ expression '... .Where(ti0 => !(new PatientJoinRow(ti0.Outer.Outer, ti0.Outer.Inner, ti0.Inner).Patient.IsDeleted))' could not be translated.
```

EF Core has special first-class translation support for **anonymous types** (`new { a, b, c }`) as an intermediate projection that gets filtered afterward. A named type constructed via a parameterized constructor — including a `record`, which is exactly that under the hood — does not get the same treatment once something downstream filters against it.

The fix, and the better pattern generally for a query with several independent optional filters (see `GetPatientsQueryHandler` for the full example): filter against the **plain root entity type** (`IQueryable<Patient>`) using correlated subqueries for anything that depends on a related entity (`query.Where(p => context.Owners.Any(o => o.Id == p.OwnerId && o.City == city))`), and only bring in the related entities via an actual `join` once, right at the end, feeding directly into the final `.Select()` projection to the response DTO. This has two benefits beyond just avoiding the translation failure: filter methods get a real, already-named type in their signature (no synthetic type needed at all), and ordering/pagination (`OrderBy`/`Skip`/`Take`) can happen on the plain entity *before* the join, so the join only ever processes one page's worth of rows instead of the whole filtered result set.

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
