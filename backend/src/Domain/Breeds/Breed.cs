using SharedKernel;

namespace Domain.Breeds;

public sealed class Breed : Entity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public Species Species { get; private set; }

    private Breed() { } // EF Core

    public static Breed Create(string name, Species species)
    {
        var breed = new Breed
        {
            Id = Guid.NewGuid(),
            Name = name,
            Species = species
        };

        breed.Raise(new BreedCreatedDomainEvent(breed.Id));

        return breed;
    }
}
