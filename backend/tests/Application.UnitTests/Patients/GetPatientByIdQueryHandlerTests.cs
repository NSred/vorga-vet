using Application.Patients.GetById;
using Application.UnitTests.Abstractions;
using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using SharedKernel;

namespace Application.UnitTests.Patients;

public sealed class GetPatientByIdQueryHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenPatientDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var missingPatientId = Guid.NewGuid();
        var handler = new GetPatientByIdQueryHandler(context);

        // Act
        Result<PatientDetailResponse> result = await handler.Handle(
            new GetPatientByIdQuery(missingPatientId),
            CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(PatientErrors.NotFound(missingPatientId));
    }

    [Fact]
    public async Task Handle_Should_ReturnPatientDetails_WhenPatientHasNoAllergens()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var owner = Owner.Create("Ana", "Petrović", "064/1234567", "Zmaj Jovina 4", "Novi Sad");
        var breed = Breed.Create("Labrador", Species.Dog);
        context.Owners.Add(owner);
        context.Breeds.Add(breed);

        var patient = Patient.Create(
            owner.Id, breed.Id, "12345", "Rex", Sex.Male,
            null, 12.5m, "Brown", "CHIP-1", "Healthy", "No notes", DateTime.UtcNow);
        context.Patients.Add(patient);
        await context.SaveChangesAsync();

        var handler = new GetPatientByIdQueryHandler(context);

        // Act
        Result<PatientDetailResponse> result = await handler.Handle(
            new GetPatientByIdQuery(patient.Id),
            CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        PatientDetailResponse response = result.Value;
        response.Id.ShouldBe(patient.Id);
        response.OwnerId.ShouldBe(owner.Id);
        response.BreedId.ShouldBe(breed.Id);
        response.OwnerName.ShouldBe("Ana Petrović");
        response.BreedName.ShouldBe("Labrador");
        response.Species.ShouldBe(Species.Dog);
        response.Anamnesis.ShouldBe("Healthy");
        response.Note.ShouldBe("No notes");
        response.Allergies.ShouldBeEmpty();
    }

    [Fact]
    public async Task Handle_Should_IncludeAllergies_WhenPatientHasAllergens()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var owner = Owner.Create("Ana", "Petrović", "064/1234567", "Zmaj Jovina 4", "Novi Sad");
        var breed = Breed.Create("Labrador", Species.Dog);
        var pollen = Allergen.Create("Pollen");
        var chicken = Allergen.Create("Chicken protein");
        context.Owners.Add(owner);
        context.Breeds.Add(breed);
        context.Allergens.Add(pollen);
        context.Allergens.Add(chicken);

        var patient = Patient.Create(
            owner.Id, breed.Id, "12345", "Rex", Sex.Male,
            null, null, null, null, null, null, DateTime.UtcNow);
        context.Patients.Add(patient);
        context.PatientAllergens.Add(PatientAllergen.Create(patient.Id, pollen.Id));
        context.PatientAllergens.Add(PatientAllergen.Create(patient.Id, chicken.Id));
        await context.SaveChangesAsync();

        var handler = new GetPatientByIdQueryHandler(context);

        // Act
        Result<PatientDetailResponse> result = await handler.Handle(
            new GetPatientByIdQuery(patient.Id),
            CancellationToken.None);

        // Assert
        PatientDetailResponse response = result.Value;
        response.Allergies.ShouldBe(
            [new AllergenSummary(pollen.Id, "Pollen"), new AllergenSummary(chicken.Id, "Chicken protein")],
            ignoreOrder: true);
    }
}
