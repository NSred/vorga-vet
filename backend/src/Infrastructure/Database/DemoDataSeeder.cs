using Domain.Appointments;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Domain.Users;
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

    // Day offsets are relative to today in clinic-local time, so the demo calendar always
    // has something in the past, something now and something ahead.
    private static readonly AppointmentSeed[] AppointmentSeeds =
    [
        new(-7, 9, 0, 30, AppointmentType.Checkup, AppointmentStatus.Completed, "D25-10001", "Annual checkup and vaccination"),
        new(-7, 11, 0, 45, AppointmentType.BloodDraw, AppointmentStatus.Completed, "C25-10002", "Routine blood panel"),
        new(-5, 10, 30, 60, AppointmentType.Surgery, AppointmentStatus.Completed, "D25-10005", "Dental extraction"),
        new(-3, 8, 30, 30, AppointmentType.Checkup, AppointmentStatus.NoShow, "D25-10009", "Limping on front left leg"),
        new(-2, 14, 0, 30, AppointmentType.FirstVisit, AppointmentStatus.Cancelled, "B25-10004", "New bird intake"),
        new(-1, 12, 0, 30, AppointmentType.Checkup, AppointmentStatus.Completed, "D25-10003", "Hip follow-up"),
        new(0, 9, 0, 30, AppointmentType.Checkup, AppointmentStatus.CheckedIn, "D25-10007", "Breathing check before travel"),
        new(0, 10, 0, 45, AppointmentType.BloodDraw, AppointmentStatus.Scheduled, "C25-10006", "Pre-anesthetic bloodwork"),
        new(0, 13, 30, 30, AppointmentType.Checkup, AppointmentStatus.Scheduled, "D25-10012", "Anxiety follow-up"),
        new(0, 16, 0, 60, AppointmentType.Surgery, AppointmentStatus.Scheduled, "C25-10010", "Neutering"),
        new(1, 8, 0, 30, AppointmentType.FirstVisit, AppointmentStatus.Scheduled, "O25-10011", "First visit for a young rabbit"),
        new(1, 11, 30, 30, AppointmentType.Checkup, AppointmentStatus.Scheduled, "C25-10013", "Weight management review"),
        new(2, 9, 30, 45, AppointmentType.BloodDraw, AppointmentStatus.Scheduled, "D25-10001", "Allergy panel recheck"),
        new(3, 15, 0, 30, AppointmentType.Checkup, AppointmentStatus.Scheduled, "B25-10008", "Feather plucking"),
        new(5, 10, 0, 60, AppointmentType.Surgery, AppointmentStatus.Scheduled, "D25-10005", "Arthritis joint injection")
    ];

    public static async Task SeedAsync(
        ApplicationDbContext dbContext,
        DateTime utcNow,
        TimeZoneInfo clinicTimeZone,
        CancellationToken cancellationToken = default)
    {
        Dictionary<string, Guid> breedIds = await SeedBreedsAsync(dbContext, cancellationToken);
        Dictionary<string, Guid> ownerIds = await SeedOwnersAsync(dbContext, cancellationToken);

        await SeedPatientsAsync(dbContext, breedIds, ownerIds, utcNow, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        await SeedAppointmentsAsync(dbContext, utcNow, clinicTimeZone, cancellationToken);

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

    // Appointments carry no natural key, so this fills an empty calendar and then leaves it
    // alone — re-running never stacks a second demo week on top of real bookings.
    private static async Task SeedAppointmentsAsync(
        ApplicationDbContext dbContext,
        DateTime utcNow,
        TimeZoneInfo clinicTimeZone,
        CancellationToken cancellationToken)
    {
        if (await dbContext.Appointments.AnyAsync(cancellationToken))
        {
            return;
        }

        User? author = await dbContext.Users
            .OrderByDescending(u => u.Role == Role.Veterinarian)
            .FirstOrDefaultAsync(cancellationToken);

        if (author is null)
        {
            return;
        }

        string[] cardNumbers = AppointmentSeeds.Select(a => a.PatientCardNumber).Distinct().ToArray();

        Dictionary<string, Patient> patients = await dbContext.Patients
            .Where(p => cardNumbers.Contains(p.CardNumber))
            .ToDictionaryAsync(p => p.CardNumber, cancellationToken);

        DateTime localToday = TimeZoneInfo.ConvertTimeFromUtc(utcNow, clinicTimeZone).Date;

        foreach (AppointmentSeed seed in AppointmentSeeds)
        {
            if (!patients.TryGetValue(seed.PatientCardNumber, out Patient? patient))
            {
                continue;
            }

            DateTime localStart = localToday
                .AddDays(seed.DayOffset)
                .AddHours(seed.Hour)
                .AddMinutes(seed.Minute);

            DateTime startsAtUtc = TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(localStart, DateTimeKind.Unspecified),
                clinicTimeZone);

            var appointment = Appointment.Create(
                author.Id,
                patient.OwnerId,
                patient.Id,
                startsAtUtc,
                seed.DurationMinutes,
                seed.Type,
                seed.Reason,
                utcNow);

            ApplyStatus(appointment, seed, startsAtUtc, author.Id);

            dbContext.Appointments.Add(appointment);
        }
    }

    private static void ApplyStatus(
        Appointment appointment,
        AppointmentSeed seed,
        DateTime startsAtUtc,
        Guid authorId)
    {
        switch (seed.Status)
        {
            case AppointmentStatus.CheckedIn:
                appointment.CheckIn(startsAtUtc);
                break;
            case AppointmentStatus.Completed:
                appointment.CheckIn(startsAtUtc);
                appointment.Complete(startsAtUtc.AddMinutes(seed.DurationMinutes), authorId);
                break;
            case AppointmentStatus.NoShow:
                appointment.MarkNoShow(startsAtUtc.AddMinutes(seed.DurationMinutes), authorId, "Did not arrive.");
                break;
            case AppointmentStatus.Cancelled:
                appointment.Cancel(startsAtUtc.AddDays(-1), authorId, "Owner cancelled by phone.");
                break;
            case AppointmentStatus.Scheduled:
            default:
                break;
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

    private sealed record AppointmentSeed(
        int DayOffset,
        int Hour,
        int Minute,
        int DurationMinutes,
        AppointmentType Type,
        AppointmentStatus Status,
        string PatientCardNumber,
        string Reason);

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
