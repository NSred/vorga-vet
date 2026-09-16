using SharedKernel;

namespace Domain.Owners;

public static class OwnerErrors
{
    public static Error NotFound(Guid ownerId) => Error.NotFound(
        "Owners.NotFound",
        $"The owner with the Id = '{ownerId}' was not found");

    public static readonly Error EmailNotUnique = Error.Conflict(
        "Owners.EmailNotUnique",
        "An owner with this email already exists");
}
