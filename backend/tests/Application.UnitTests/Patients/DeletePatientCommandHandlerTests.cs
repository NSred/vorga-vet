using Application.Patients.Delete;
using Application.UnitTests.Abstractions;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Patients;

public sealed class DeletePatientCommandHandlerTests : BaseHandlerTest
{
    private static Patient SeedPatient(TestDbContext context)
    {
        var owner = Owner.Create("Ana", "Petrović", "064/1234567", "Zmaj Jovina 4", "Novi Sad");
        var breed = Breed.Create("Labrador", Species.Dog);
        context.Owners.Add(owner);
        context.Breeds.Add(breed);

        var patient = Patient.Create(
            owner.Id, breed.Id, "12345", "Rex", Sex.Male,
            null, null, null, null, null, null, DateTime.UtcNow);
        context.Patients.Add(patient);

        return patient;
    }

    private static IDateTimeProvider CreateDateTimeProvider(DateTime utcNow)
    {
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(utcNow);
        return dateTimeProvider;
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenPatientDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var missingPatientId = Guid.NewGuid();
        var handler = new DeletePatientCommandHandler(context, CreateDateTimeProvider(DateTime.UtcNow));

        // Act
        Result result = await handler.Handle(new DeletePatientCommand(missingPatientId), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(PatientErrors.NotFound(missingPatientId));
    }

    [Fact]
    public async Task Handle_Should_ReturnAlreadyDeleted_WhenPatientIsAlreadyDeleted()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Patient patient = SeedPatient(context);
        await context.SaveChangesAsync();

        var firstDeleteHandler = new DeletePatientCommandHandler(context, CreateDateTimeProvider(DateTime.UtcNow));
        await firstDeleteHandler.Handle(new DeletePatientCommand(patient.Id), CancellationToken.None);

        var secondDeleteHandler = new DeletePatientCommandHandler(context, CreateDateTimeProvider(DateTime.UtcNow));

        // Act
        Result result = await secondDeleteHandler.Handle(new DeletePatientCommand(patient.Id), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(PatientErrors.AlreadyDeleted(patient.Id));
    }

    [Fact]
    public async Task Handle_Should_MarkPatientDeletedAndRaiseDomainEvent_WhenValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Patient patient = SeedPatient(context);
        await context.SaveChangesAsync();

        var deletedAtUtc = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var handler = new DeletePatientCommandHandler(context, CreateDateTimeProvider(deletedAtUtc));

        // Act
        Result result = await handler.Handle(new DeletePatientCommand(patient.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Patient deleted = await context.Patients.SingleAsync(p => p.Id == patient.Id);
        deleted.IsDeleted.ShouldBeTrue();
        deleted.DeletedAt.ShouldBe(deletedAtUtc);
        deleted.DomainEvents.ShouldContain(e => e is PatientDeletedDomainEvent);
    }
}
