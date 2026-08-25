# Command Slice Templates

Files go in `backend/src/Application/{Feature}/{UseCase}/`. Replace `{Feature}` (plural, e.g. `Todos`), `{Entity}` (e.g. `TodoItem`), and use-case names throughout.

## Command

Positional record for few parameters:

```csharp
using Application.Abstractions.Messaging;

namespace Application.Todos.Archive;

public sealed record ArchiveTodoCommand(Guid TodoItemId) : ICommand;
```

Class with init-style setters when there are many parameters (matches `CreateTodoCommand`):

```csharp
using Application.Abstractions.Messaging;
using Domain.Todos;

namespace Application.Todos.Create;

public sealed class CreateTodoCommand : ICommand<Guid>
{
    public Guid UserId { get; set; }
    public string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public List<string> Labels { get; set; } = [];
    public Priority Priority { get; set; }
}
```

- `ICommand` → handler returns `Result` (endpoint responds `204 NoContent`).
- `ICommand<TResponse>` → handler returns `Result<TResponse>` (endpoint responds `200 Ok`).

## Validator

Public class, same folder. Auto-registered and executed by `ValidationDecorator` before the handler runs.

```csharp
using FluentValidation;

namespace Application.Todos.Create;

public class CreateTodoCommandValidator : AbstractValidator<CreateTodoCommand>
{
    public CreateTodoCommandValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.Priority).IsInEnum();
        RuleFor(c => c.Description).NotEmpty().MaximumLength(255);
        RuleFor(c => c.DueDate).GreaterThanOrEqualTo(DateTime.Today).When(x => x.DueDate.HasValue);
    }
}
```

## Handler

`internal sealed`, primary constructor, `IApplicationDbContext` for data access. Guard clauses return `Result.Failure` with Domain errors; the happy path calls a method on the entity (never assigns its properties directly — they're `private set`), saves, and returns. The entity raises its own domain event from inside that method, not the handler.

```csharp
using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Todos;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Todos.Archive;

internal sealed class ArchiveTodoCommandHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider,
    IUserContext userContext)
    : ICommandHandler<ArchiveTodoCommand>
{
    public async Task<Result> Handle(ArchiveTodoCommand command, CancellationToken cancellationToken)
    {
        TodoItem? todoItem = await context.TodoItems
            .SingleOrDefaultAsync(
                t => t.Id == command.TodoItemId && t.UserId == userContext.UserId,
                cancellationToken);

        if (todoItem is null)
        {
            return Result.Failure(TodoItemErrors.NotFound(command.TodoItemId));
        }

        if (todoItem.IsArchived)
        {
            return Result.Failure(TodoItemErrors.AlreadyArchived(command.TodoItemId));
        }

        todoItem.Archive(dateTimeProvider.UtcNow);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
```

The corresponding entity method (added to `Domain/Todos/TodoItem.cs` as part of this slice, not by `add-entity`):

```csharp
public void Archive(DateTime archivedAtUtc)
{
    IsArchived = true;
    ArchivedAt = archivedAtUtc;

    Raise(new TodoItemArchivedDomainEvent(Id));
}
```

If several fields change together with no individual rule (a general "edit details" command), give the entity one bulk method for all of them (e.g. `UpdateDetails(string description, DateTime? dueDate, List<string> labels)`) rather than one method per field — reserve separate dedicated methods for fields that carry their own invariant, like `Archive` above bundling a flag, a timestamp, and an event together. The `AlreadyArchived` guard stays in the handler (it's about whether the command is *allowed to run*, not about keeping the entity's own state internally consistent) — put a check inside the entity method itself only when the entity must refuse to reach the resulting state at all, from any caller, always.

Notes:
- Ownership: either filter by `userContext.UserId` in the query (preferred) or compare explicitly and return `Result.Failure(UserErrors.Unauthorized())`.
- `IDateTimeProvider` (from `SharedKernel`) for timestamps — never `DateTime.UtcNow` directly.
- If the command invalidates cached query data, inject `HybridCache` and call `cache.RemoveAsync({Feature}CacheKeys.X(...), cancellationToken)` after saving.
- For a returning command (`ICommand<Guid>`), return the value directly — `Result<T>` has an implicit conversion: `return todoItem.Id;`.
- Creation commands call the entity's `Create(...)` factory (from `add-entity`) instead of an object initializer: `var todoItem = TodoItem.Create(command.UserId, command.Description, ...);` then `context.TodoItems.Add(todoItem);`. Use `var` here, not the explicit type — the repo's analyzer (IDE0007) errors on `TodoItem todoItem = TodoItem.Create(...)` because the type is apparent from a static factory call.

## Domain additions (if needed)

Error factory on the existing `{Entity}Errors` class in `backend/src/Domain/{Feature}/`:

```csharp
public static Error AlreadyArchived(Guid todoItemId) => Error.Problem(
    "TodoItems.AlreadyArchived",
    $"The todo item with Id = '{todoItemId}' is already archived.");
```

Error type → HTTP status (via `CustomResults.Problem`): `NotFound` → 404, `Conflict` → 409, `Problem`/`Validation` → 400, `Failure` → 500.

Domain event, one file each in `backend/src/Domain/{Feature}/`:

```csharp
using SharedKernel;

namespace Domain.Todos;

public sealed record TodoItemArchivedDomainEvent(Guid TodoItemId) : IDomainEvent;
```

Optional event handler (Application layer, in the use-case folder):

```csharp
using Domain.Todos;
using SharedKernel;

namespace Application.Todos.Archive;

internal sealed class TodoItemArchivedDomainEventHandler : IDomainEventHandler<TodoItemArchivedDomainEvent>
{
    public Task Handle(TodoItemArchivedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Side effects here (notifications, projections, ...)
        return Task.CompletedTask;
    }
}
```
