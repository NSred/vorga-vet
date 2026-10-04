using SharedKernel;

namespace Domain.Breeds;

public static class BreedErrors
{
    public static Error NotFound(Guid breedId) => Error.NotFound(
        "Breeds.NotFound",
        $"The breed with the Id = '{breedId}' was not found");
}
