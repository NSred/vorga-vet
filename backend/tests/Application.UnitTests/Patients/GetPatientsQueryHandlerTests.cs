using Application.Patients.Get;
using Application.UnitTests.Abstractions;
using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using SharedKernel;

namespace Application.UnitTests.Patients;

public sealed class GetPatientsQueryHandlerTests : BaseHandlerTest
{
    private static void SeedPatient(
        TestDbContext context,
        string name,
        Species species = Species.Dog,
        Sex sex = Sex.Male,
        string city = "Novi Sad",
        bool isDeleted = false,
        IEnumerable<Allergen>? allergens = null)
    {
        var owner = Owner.Create("Owner", "Of " + name, "064/0000000", "Some address", city);
        var breed = Breed.Create("Breed for " + name, species);
        context.Owners.Add(owner);
        context.Breeds.Add(breed);

        var patient = Patient.Create(
            owner.Id,
            breed.Id,
            Guid.NewGuid().ToString("N")[..8],
            name,
            sex,
            null,
            null,
            null,
            null,
            null,
            null,
            DateTime.UtcNow);

        context.Patients.Add(patient);

        if (isDeleted)
        {
            // Patient has no MarkDeleted() method yet — that arrives with the DeletePatient
            // feature. Setting the private-setter property directly via the change tracker is
            // the accepted way to arrange this state in a test without it.
            context.Entry(patient).Property(p => p.IsDeleted).CurrentValue = true;
        }

        foreach (Allergen allergen in allergens ?? [])
        {
            context.PatientAllergens.Add(PatientAllergen.Create(patient.Id, allergen.Id));
        }
    }

    private static GetPatientsQuery DefaultQuery(
        string? searchTerm = null,
        Species? species = null,
        Sex? sex = null,
        Guid? allergenId = null,
        string? city = null,
        PatientStatusFilter status = PatientStatusFilter.Active,
        int page = 1,
        int pageSize = 10) => new(searchTerm, species, sex, allergenId, city, status, page, pageSize);

    [Fact]
    public async Task Handle_Should_ExcludeDeletedPatients_WhenStatusIsActive()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Active One");
        SeedPatient(context, "Deleted One", isDeleted: true);
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(DefaultQuery(), CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Active One"]);
    }

    [Fact]
    public async Task Handle_Should_ReturnOnlyDeletedPatients_WhenStatusIsDeleted()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Active One");
        SeedPatient(context, "Deleted One", isDeleted: true);
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(status: PatientStatusFilter.Deleted),
            CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Deleted One"]);
    }

    [Fact]
    public async Task Handle_Should_ReturnBothPatients_WhenStatusIsAll()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Active One");
        SeedPatient(context, "Deleted One", isDeleted: true);
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(status: PatientStatusFilter.All),
            CancellationToken.None);

        // Assert
        result.Value.Items.Count.ShouldBe(2);
    }

    [Fact]
    public async Task Handle_Should_FilterBySpecies()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Rex", Species.Dog);
        SeedPatient(context, "Luna", Species.Cat);
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(species: Species.Cat),
            CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Luna"]);
    }

    [Fact]
    public async Task Handle_Should_FilterBySex()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Rex", sex: Sex.Male);
        SeedPatient(context, "Bella", sex: Sex.Female);
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(sex: Sex.Female),
            CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Bella"]);
    }

    [Fact]
    public async Task Handle_Should_FilterByCity()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Rex", city: "Novi Sad");
        SeedPatient(context, "Bella", city: "Beograd");
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(city: "Beograd"),
            CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Bella"]);
    }

    [Fact]
    public async Task Handle_Should_FilterByAllergenId()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var pollen = Allergen.Create("Pollen");
        context.Allergens.Add(pollen);
        SeedPatient(context, "Rex", allergens: [pollen]);
        SeedPatient(context, "Bella");
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(allergenId: pollen.Id),
            CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Rex"]);
    }

    [Fact]
    public async Task Handle_Should_IncludeAllergyNames_ForPatientsWithAllergens()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var pollen = Allergen.Create("Pollen");
        var chicken = Allergen.Create("Chicken protein");
        context.Allergens.Add(pollen);
        context.Allergens.Add(chicken);
        SeedPatient(context, "Rex", allergens: [pollen, chicken]);
        SeedPatient(context, "Bella");
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(DefaultQuery(), CancellationToken.None);

        // Assert
        PatientResponse rex = result.Value.Items.Single(p => p.Name == "Rex");
        PatientResponse bella = result.Value.Items.Single(p => p.Name == "Bella");
        rex.Allergies.ShouldBe(["Chicken protein", "Pollen"], ignoreOrder: true);
        bella.Allergies.ShouldBeEmpty();
    }

    [Fact]
    public async Task Handle_Should_OrderResultsByName()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Zoro");
        SeedPatient(context, "Ana");
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(DefaultQuery(), CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Ana", "Zoro"]);
    }

    [Fact]
    public async Task Handle_Should_PaginateResults()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        for (int i = 0; i < 5; i++)
        {
            SeedPatient(context, $"Patient {i:D2}");
        }
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(page: 2, pageSize: 2),
            CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Patient 02", "Patient 03"]);
        result.Value.TotalCount.ShouldBe(5);
        result.Value.Page.ShouldBe(2);
        result.Value.PageSize.ShouldBe(2);
    }

    [Fact]
    public async Task Handle_Should_ClampPageSize_WhenPageSizeExceedsMaximum()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedPatient(context, "Rex");
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(
            DefaultQuery(pageSize: 1000),
            CancellationToken.None);

        // Assert
        result.Value.PageSize.ShouldBe(10);
    }
}
