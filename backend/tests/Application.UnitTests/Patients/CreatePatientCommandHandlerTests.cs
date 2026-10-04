using Application.Patients.Create;
using Application.UnitTests.Abstractions;
using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Patients;

public sealed class CreatePatientCommandHandlerTests : BaseHandlerTest
{
    private static Owner SeedOwner(TestDbContext context)
    {
        var owner = Owner.Create("Ana", "Petrović", "064/1234567", "Zmaj Jovina 4", "Novi Sad");
        context.Owners.Add(owner);
        return owner;
    }

    private static Breed SeedBreed(TestDbContext context)
    {
        var breed = Breed.Create("Labrador", Species.Dog);
        context.Breeds.Add(breed);
        return breed;
    }

    private static Allergen SeedAllergen(TestDbContext context, string name = "Pollen")
    {
        var allergen = Allergen.Create(name);
        context.Allergens.Add(allergen);
        return allergen;
    }

    private static CreatePatientCommand ValidCommand(Guid ownerId, Guid breedId) => new()
    {
        OwnerId = ownerId,
        BreedId = breedId,
        CardNumber = Guid.NewGuid().ToString("N")[..8],
        Name = "Rex",
        Sex = Sex.Male
    };

    private static IDateTimeProvider CreateDateTimeProvider()
    {
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(DateTime.UtcNow);
        return dateTimeProvider;
    }

    [Fact]
    public async Task Handle_Should_ReturnConflict_WhenCardNumberAlreadyExists()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        await context.SaveChangesAsync();

        CreatePatientCommand firstCommand = ValidCommand(owner.Id, breed.Id);
        var handler = new CreatePatientCommandHandler(context, CreateDateTimeProvider());
        await handler.Handle(firstCommand, CancellationToken.None);

        CreatePatientCommand secondCommand = ValidCommand(owner.Id, breed.Id);
        secondCommand.CardNumber = firstCommand.CardNumber;

        // Act
        Result<Guid> result = await handler.Handle(secondCommand, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(PatientErrors.CardNumberNotUnique);
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenOwnerDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Breed breed = SeedBreed(context);
        await context.SaveChangesAsync();

        var missingOwnerId = Guid.NewGuid();
        CreatePatientCommand command = ValidCommand(missingOwnerId, breed.Id);
        var handler = new CreatePatientCommandHandler(context, CreateDateTimeProvider());

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Error.ShouldBe(OwnerErrors.NotFound(missingOwnerId));
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenBreedDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        await context.SaveChangesAsync();

        var missingBreedId = Guid.NewGuid();
        CreatePatientCommand command = ValidCommand(owner.Id, missingBreedId);
        var handler = new CreatePatientCommandHandler(context, CreateDateTimeProvider());

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

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
        await context.SaveChangesAsync();

        var missingAllergenId = Guid.NewGuid();
        CreatePatientCommand command = ValidCommand(owner.Id, breed.Id);
        command.AllergenIds = [missingAllergenId];
        var handler = new CreatePatientCommandHandler(context, CreateDateTimeProvider());

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AllergenErrors.NotFound(missingAllergenId));
    }

    [Fact]
    public async Task Handle_Should_CreatePatientAndRaiseDomainEvent_WhenValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        await context.SaveChangesAsync();

        CreatePatientCommand command = ValidCommand(owner.Id, breed.Id);
        var handler = new CreatePatientCommandHandler(context, CreateDateTimeProvider());

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Patient patient = await context.Patients.SingleAsync(p => p.Id == result.Value);
        patient.OwnerId.ShouldBe(owner.Id);
        patient.BreedId.ShouldBe(breed.Id);
        patient.CardNumber.ShouldBe(command.CardNumber);
        patient.IsDeleted.ShouldBeFalse();
        patient.DomainEvents.ShouldContain(e => e is PatientCreatedDomainEvent);
    }

    [Fact]
    public async Task Handle_Should_CreatePatientAllergenLinks_WhenAllergenIdsProvided()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Owner owner = SeedOwner(context);
        Breed breed = SeedBreed(context);
        Allergen allergenOne = SeedAllergen(context, "Pollen");
        Allergen allergenTwo = SeedAllergen(context, "Chicken protein");
        await context.SaveChangesAsync();

        CreatePatientCommand command = ValidCommand(owner.Id, breed.Id);
        command.AllergenIds = [allergenOne.Id, allergenTwo.Id, allergenOne.Id]; // duplicate on purpose
        var handler = new CreatePatientCommandHandler(context, CreateDateTimeProvider());

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        List<Guid> linkedAllergenIds = await context.PatientAllergens
            .Where(pa => pa.PatientId == result.Value)
            .Select(pa => pa.AllergenId)
            .ToListAsync();

        linkedAllergenIds.Count.ShouldBe(2);
        linkedAllergenIds.ShouldContain(allergenOne.Id);
        linkedAllergenIds.ShouldContain(allergenTwo.Id);
    }
}
