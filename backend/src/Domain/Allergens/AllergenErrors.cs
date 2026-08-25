using SharedKernel;

namespace Domain.Allergens;

public static class AllergenErrors
{
    public static Error NotFound(Guid allergenId) => Error.NotFound(
        "Allergens.NotFound",
        $"The allergen with the Id = '{allergenId}' was not found");
}
