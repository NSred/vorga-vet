using SharedKernel;

namespace Domain.Allergens;

public sealed class Allergen : Entity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }

    private Allergen() { } // EF Core

    public static Allergen Create(string name)
    {
        var allergen = new Allergen
        {
            Id = Guid.NewGuid(),
            Name = name
        };

        allergen.Raise(new AllergenCreatedDomainEvent(allergen.Id));

        return allergen;
    }
}
