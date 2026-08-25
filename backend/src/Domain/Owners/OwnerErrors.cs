using SharedKernel;

namespace Domain.Owners;

public static class OwnerErrors
{
    public static Error NotFound(Guid ownerId) => Error.NotFound(
        "Owners.NotFound",
        $"The owner with the Id = '{ownerId}' was not found");
}
