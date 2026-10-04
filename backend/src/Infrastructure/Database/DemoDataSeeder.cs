using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Database;

public static class DemoDataSeeder
{
    private static readonly BreedSeed[] BreedSeeds =
    [
        new("Labrador Retriever", Species.Dog),
        new("German Shepherd", Species.Dog),
        new("Golden Retriever", Species.Dog),
        new("French Bulldog", Species.Dog),
        new("Beagle", Species.Dog),
        new("Poodle", Species.Dog),
        new("Yorkshire Terrier", Species.Dog),
        new("Border Collie", Species.Dog),
        new("Mixed Breed", Species.Dog),
        new("Domestic Shorthair", Species.Cat),
        new("British Shorthair", Species.Cat),
        new("Maine Coon", Species.Cat),
        new("Persian", Species.Cat),
        new("Siamese", Species.Cat),
        new("Ragdoll", Species.Cat),
        new("Budgerigar", Species.Bird),
        new("Cockatiel", Species.Bird),
        new("African Grey Parrot", Species.Bird),
        new("Holland Lop Rabbit", Species.Other),
        new("Guinea Pig", Species.Other)
    ];

    private static readonly OwnerSeed[] OwnerSeeds =
    [
        new("Marko", "Petrović", "+381 64 123 4567", "Knez Mihailova 12", "Beograd", "marko.petrovic@example.com"),
        new("Jelena", "Jovanović", "+381 63 234 5678", "Bulevar oslobođenja 45", "Novi Sad", "jelena.jovanovic@example.com"),
        new("Nikola", "Nikolić", "+381 65 345 6789", "Nemanjina 8", "Beograd", "nikola.nikolic@example.com"),
        new("Ana", "Marković", "+381 62 456 7890", "Zmaj Jovina 3", "Novi Sad", "ana.markovic@example.com"),
        new("Stefan", "Ilić", "+381 60 567 8901", "Cara Dušana 21", "Niš", "stefan.ilic@example.com"),
        new("Milica", "Đorđević", "+381 64 678 9012", "Vojvode Stepe 150", "Beograd", "milica.djordjevic@example.com")
    ];

    private static readonly PatientSeed[] PatientSeeds =
    [
        new("D25-10001", "Max", "marko.petrovic@example.com", "Labrador Retriever", Sex.Male, Date(2019, 4, 12), 32.5m, "Yellow", "688038000123451", "Seasonal skin allergy, treated with antihistamines."),
        new("C25-10002", "Luna", "marko.petrovic@example.com", "Domestic Shorthair", Sex.Female, Date(2021, 8, 1), 4.2m, "Tabby", "688038000123452", null),
        new("D25-10003", "Bella", "jelena.jovanovic@example.com", "Golden Retriever", Sex.Female, Date(2018, 2, 20), 29.0m, "Golden", "688038000123453", "Hip dysplasia, on joint supplements."),
        new("B25-10004", "Coco", "jelena.jovanovic@example.com", "Budgerigar", Sex.Male, Date(2023, 5, 10), 0.04m, "Green", null, null),
        new("D25-10005", "Rex", "nikola.nikolic@example.com", "German Shepherd", Sex.Male, Date(2017, 11, 3), 38.0m, "Black and tan", "688038000123455", "Senior with mild arthritis."),
        new("C25-10006", "Mia", "nikola.nikolic@example.com", "Persian", Sex.Female, Date(2020, 6, 15), 3.8m, "White", "688038000123456", null),
        new("D25-10007", "Loki", "ana.markovic@example.com", "French Bulldog", Sex.Male, Date(2022, 1, 9), 12.3m, "Fawn", "688038000123457", "Brachycephalic, monitor breathing under anesthesia."),
        new("B25-10008", "Kiki", "ana.markovic@example.com", "Cockatiel", Sex.Female, Date(2022, 9, 30), 0.09m, "Grey", null, null),
        new("D25-10009", "Charlie", "stefan.ilic@example.com", "Beagle", Sex.Male, Date(2020, 3, 22), 14.1m, "Tricolor", "688038000123459", null),
        new("C25-10010", "Simba", "stefan.ilic@example.com", "Maine Coon", Sex.Male, Date(2019, 12, 1), 7.5m, "Brown tabby", "688038000123460", null),
        new("O25-10011", "Bunny", "stefan.ilic@example.com", "Holland Lop Rabbit", Sex.Female, Date(2023, 3, 3), 1.6m, "White and brown", null, null),
        new("D25-10012", "Lola", "milica.djordjevic@example.com", "Mixed Breed", Sex.Female, Date(2016, 7, 7), 18.0m, "Brown", "688038000123462", "Rescue dog, anxious at the clinic."),
        new("C25-10013", "Oscar", "milica.djordjevic@example.com", "British Shorthair", Sex.Male, Date(2021, 10, 10), 5.6m, "Blue", "688038000123463", null)
    ];

    public static async Task SeedAsync(
        ApplicationDbContext dbContext,
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        Dictionary<string, Guid> breedIds = await SeedBreedsAsync(dbContext, cancellationToken);
        Dictionary<string, Guid> ownerIds = await SeedOwnersAsync(dbContext, cancellationToken);

        await SeedPatientsAsync(dbContext, breedIds, ownerIds, utcNow, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task<Dictionary<string, Guid>> SeedBreedsAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        List<Breed> existingBreeds = await dbContext.Breeds.ToListAsync(cancellationToken);

        var breedIds = new Dictionary<string, Guid>();

        foreach (BreedSeed seed in BreedSeeds)
        {
            Breed? breed = existingBreeds.Find(b => b.Species == seed.Species && b.Name == seed.Name);

            if (breed is null)
            {
                breed = Breed.Create(seed.Name, seed.Species);
                dbContext.Breeds.Add(breed);
            }

            breedIds[seed.Name] = breed.Id;
        }

        return breedIds;
    }

    private static async Task<Dictionary<string, Guid>> SeedOwnersAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        string[] emails = OwnerSeeds.Select(o => o.Email).ToArray();

        List<Owner> existingOwners = await dbContext.Owners
            .Where(o => o.Email != null && emails.Contains(o.Email))
            .ToListAsync(cancellationToken);

        var ownerIds = new Dictionary<string, Guid>();

        foreach (OwnerSeed seed in OwnerSeeds)
        {
            Owner? owner = existingOwners.Find(o => o.Email == seed.Email);

            if (owner is null)
            {
                owner = Owner.Create(seed.FirstName, seed.LastName, seed.PhoneNumber, seed.Address, seed.City, seed.Email);
                dbContext.Owners.Add(owner);
            }

            ownerIds[seed.Email] = owner.Id;
        }

        return ownerIds;
    }

    private static async Task SeedPatientsAsync(
        ApplicationDbContext dbContext,
        Dictionary<string, Guid> breedIds,
        Dictionary<string, Guid> ownerIds,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        string[] cardNumbers = PatientSeeds.Select(p => p.CardNumber).ToArray();

        List<string> existingCardNumbers = await dbContext.Patients
            .Where(p => cardNumbers.Contains(p.CardNumber))
            .Select(p => p.CardNumber)
            .ToListAsync(cancellationToken);

        foreach (PatientSeed seed in PatientSeeds.Where(p => !existingCardNumbers.Contains(p.CardNumber)))
        {
            dbContext.Patients.Add(Patient.Create(
                ownerIds[seed.OwnerEmail],
                breedIds[seed.BreedName],
                seed.CardNumber,
                seed.Name,
                seed.Sex,
                seed.BirthDate,
                seed.WeightKg,
                seed.Color,
                seed.ChipNumber,
                seed.Anamnesis,
                null,
                utcNow));
        }
    }

    private static DateTime Date(int year, int month, int day) => new(year, month, day, 0, 0, 0, DateTimeKind.Utc);

    private sealed record BreedSeed(string Name, Species Species);

    private sealed record OwnerSeed(
        string FirstName,
        string LastName,
        string PhoneNumber,
        string Address,
        string City,
        string Email);

    private sealed record PatientSeed(
        string CardNumber,
        string Name,
        string OwnerEmail,
        string BreedName,
        Sex Sex,
        DateTime BirthDate,
        decimal WeightKg,
        string Color,
        string? ChipNumber,
        string? Anamnesis);
}
