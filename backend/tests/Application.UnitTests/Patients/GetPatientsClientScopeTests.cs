using Application.Abstractions.Authentication;
using Application.Patients.Get;
using Application.Patients.GetById;
using Application.UnitTests.Abstractions;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Domain.Users;
using SharedKernel;

namespace Application.UnitTests.Patients;

/// <summary>
/// A client's view of the patient roster is scoped to the animals under their own linked
/// owner record — never the whole clinic, and an empty list when they have no linked owner.
/// </summary>
public sealed class GetPatientsClientScopeTests : BaseHandlerTest
{
    private static IUserContext ClientContext(Guid userId)
    {
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.Role.Returns(Role.Client);
        userContext.UserId.Returns(userId);

        return userContext;
    }

    private static Patient SeedPatient(TestDbContext context, Owner owner, string name)
    {
        var breed = Breed.Create("Breed " + name, Species.Dog);
        context.Breeds.Add(breed);

        var patient = Patient.Create(
            owner.Id, breed.Id, Guid.NewGuid().ToString("N")[..8], name, Sex.Male,
            null, null, null, null, null, null, DateTime.UtcNow);
        context.Patients.Add(patient);

        return patient;
    }

    [Fact]
    public async Task GetPatients_Should_ReturnOnlyTheClientsOwnAnimals()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var me = Guid.NewGuid();

        var myOwner = Owner.Create("Marko", "Ilić", "064/1", "Adresa 1", "Novi Sad");
        myOwner.LinkToUser(me);
        var otherOwner = Owner.Create("Ana", "Petrović", "064/2", "Adresa 2", "Beograd");
        context.Owners.AddRange(myOwner, otherOwner);

        SeedPatient(context, myOwner, "Luna");
        SeedPatient(context, otherOwner, "Rex");
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context, ClientContext(me));
        var query = new GetPatientsQuery(null, null, null, null, null, PatientStatusFilter.Active, 1, 10);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Value.Items.Select(p => p.Name).ShouldBe(["Luna"]);
        result.Value.TotalCount.ShouldBe(1);
    }

    [Fact]
    public async Task GetPatients_Should_ReturnNothing_WhenClientHasNoLinkedOwner()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var someOwner = Owner.Create("Ana", "Petrović", "064/2", "Adresa 2", "Beograd");
        context.Owners.Add(someOwner);
        SeedPatient(context, someOwner, "Rex");
        await context.SaveChangesAsync();

        var handler = new GetPatientsQueryHandler(context, ClientContext(Guid.NewGuid()));
        var query = new GetPatientsQuery(null, null, null, null, null, PatientStatusFilter.Active, 1, 10);

        // Act
        Result<GetPatientsResponse> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Value.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task GetPatientById_Should_ReturnNotFound_WhenAnimalBelongsToSomeoneElse()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var otherOwner = Owner.Create("Ana", "Petrović", "064/2", "Adresa 2", "Beograd");
        context.Owners.Add(otherOwner);
        Patient rex = SeedPatient(context, otherOwner, "Rex");
        await context.SaveChangesAsync();

        var handler = new GetPatientByIdQueryHandler(context, ClientContext(Guid.NewGuid()));

        // Act
        Result<PatientDetailResponse> result = await handler.Handle(new GetPatientByIdQuery(rex.Id), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(PatientErrors.NotFound(rex.Id));
    }
}
