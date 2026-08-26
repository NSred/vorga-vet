using Application.Patients.Update;
using Application.UnitTests.Abstractions;
using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Patients;

public sealed class UpdatePatientCommandHandlerTests : BaseHandlerTest
{
    private static Owner SeedOwner(TestDbContext context, string firstName = "Ana")
    {
        var owner = Owner.Create(firstName, "Petrović", "064/1234567", "Zmaj Jovina 4", "Novi Sad");
        context.Owners.Add(owner);
        return owner;
    }

    private static Breed SeedBreed(TestDbContext context, string name = "Labrador")
    {
        var breed = Breed.Create(name, Species.Dog);
        context.Breeds.Add(breed);
        return breed;
    }

    private static Allergen SeedAllergen(TestDbContext context, string name)
    {
        var allergen = Allergen.Create(name);
        context.Allergens.Add(allergen);
        return allergen;
    }

    private static Patient SeedPatient(TestDbContext context, Guid ownerId, Guid breedId, string cardNumber)
    {
        var patient = Patient.Create(
            ownerId, breedId, cardNumber, "Rex", Sex.Male,
            null, null, null, null, null, null, DateTime.UtcNow);
        context.Patients.Add(patient);
        return patient;
    }

    private static UpdatePatientCommand ValidCommand(Guid patientId, Guid ownerId, Guid breedId, string cardNumber) => new()
    {
        PatientId = patientId,
        OwnerId = ownerId,
        BreedId = breedId,
        CardNumber = cardNumber,
        Name = "Rex",
        Sex = Sex.Male
    };

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenPatientDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        await context.SaveChangesAsync();

        var missingPatientId = Guid.NewGuid();
        var handler = new UpdatePatientCommandHandler(context);

        // Act
        Result result = await handler.Handle(
            ValidCommand(missingPatientId, owner.Id, breed.Id, "12345"),
            CancellationToken.None);

        // Assert
        result.Error.ShouldBe(PatientErrors.NotFound(missingPatientId));
    }

    [Fact]
    public async Task Handle_Should_ReturnConflict_WhenCardNumberTakenByAnotherPatient()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        Patient patientToUpdate = SeedPatient(context, owner.Id, breed.Id, "11111");
        Patient otherPatient = SeedPatient(context, owner.Id, breed.Id, "22222");
        await context.SaveChangesAsync();

        var handler = new UpdatePatientCommandHandler(context);

        // Act — try to update patientToUpdate to use otherPatient's card number
        Result result = await handler.Handle(
            ValidCommand(patientToUpdate.Id, owner.Id, breed.Id, otherPatient.CardNumber),
            CancellationToken.None);

        // Assert
        result.Error.ShouldBe(PatientErrors.CardNumberNotUnique);
    }

    [Fact]
    public async Task Handle_Should_Succeed_WhenCardNumberIsUnchanged()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        Patient patient = SeedPatient(context, owner.Id, breed.Id, "11111");
        await context.SaveChangesAsync();

        var handler = new UpdatePatientCommandHandler(context);

        // Act — updating with the patient's own current card number must not conflict with itself
        Result result = await handler.Handle(
            ValidCommand(patient.Id, owner.Id, breed.Id, "11111"),
            CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenOwnerDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        Patient patient = SeedPatient(context, owner.Id, breed.Id, "11111");
        await context.SaveChangesAsync();

        var missingOwnerId = Guid.NewGuid();
        var handler = new UpdatePatientCommandHandler(context);

        // Act
        Result result = await handler.Handle(
            ValidCommand(patient.Id, missingOwnerId, breed.Id, "11111"),
            CancellationToken.None);

        // Assert
        result.Error.ShouldBe(OwnerErrors.NotFound(missingOwnerId));
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenBreedDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        Patient patient = SeedPatient(context, owner.Id, breed.Id, "11111");
        await context.SaveChangesAsync();

        var missingBreedId = Guid.NewGuid();
        var handler = new UpdatePatientCommandHandler(context);

        // Act
        Result result = await handler.Handle(
            ValidCommand(patient.Id, owner.Id, missingBreedId, "11111"),
            CancellationToken.None);

        // Assert
        result.Error.ShouldBe(BreedErrors.NotFound(missingBreedId));
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenAnAllergenDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        Patient patient = SeedPatient(context, owner.Id, breed.Id, "11111");
        await context.SaveChangesAsync();

        var missingAllergenId = Guid.NewGuid();
        UpdatePatientCommand command = ValidCommand(patient.Id, owner.Id, breed.Id, "11111");
        command.AllergenIds = [missingAllergenId];
        var handler = new UpdatePatientCommandHandler(context);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AllergenErrors.NotFound(missingAllergenId));
    }

    [Fact]
    public async Task Handle_Should_UpdateFieldsAndRaiseDomainEvent_WhenValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner originalOwner = SeedOwner(context, "Ana");
        Owner newOwner = SeedOwner(context, "Milan");
        Breed originalBreed = SeedBreed(context, "Labrador");
        Breed newBreed = SeedBreed(context, "Mops");
        Patient patient = SeedPatient(context, originalOwner.Id, originalBreed.Id, "11111");
        await context.SaveChangesAsync();

        UpdatePatientCommand command = ValidCommand(patient.Id, newOwner.Id, newBreed.Id, "99999");
        command.Name = "Bobi";
        var handler = new UpdatePatientCommandHandler(context);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Patient updated = await context.Patients.SingleAsync(p => p.Id == patient.Id);
        updated.OwnerId.ShouldBe(newOwner.Id);
        updated.BreedId.ShouldBe(newBreed.Id);
        updated.CardNumber.ShouldBe("99999");
        updated.Name.ShouldBe("Bobi");
        updated.DomainEvents.ShouldContain(e => e is PatientUpdatedDomainEvent);
    }

    [Fact]
    public async Task Handle_Should_SyncAllergenLinks_AddingAndRemovingAsNeeded()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        Allergen pollen = SeedAllergen(context, "Pollen");
        Allergen chicken = SeedAllergen(context, "Chicken protein");
        Patient patient = SeedPatient(context, owner.Id, breed.Id, "11111");
        context.PatientAllergens.Add(PatientAllergen.Create(patient.Id, pollen.Id));
        await context.SaveChangesAsync();

        UpdatePatientCommand command = ValidCommand(patient.Id, owner.Id, breed.Id, "11111");
        command.AllergenIds = [chicken.Id]; // drop pollen, add chicken
        var handler = new UpdatePatientCommandHandler(context);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        List<Guid> linkedAllergenIds = await context.PatientAllergens
            .Where(pa => pa.PatientId == patient.Id)
            .Select(pa => pa.AllergenId)
            .ToListAsync();

        linkedAllergenIds.ShouldBe([chicken.Id]);
    }
}
