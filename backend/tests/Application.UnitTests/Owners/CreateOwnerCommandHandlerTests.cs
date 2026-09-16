using Application.Owners.Create;
using Application.UnitTests.Abstractions;
using Domain.Owners;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Owners;

public sealed class CreateOwnerCommandHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_Should_CreateOwnerAndRaiseDomainEvent_WhenValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();

        var command = new CreateOwnerCommand
        {
            FirstName = "Ana",
            LastName = "Petrović",
            PhoneNumber = "064/1234567",
            Address = "Zmaj Jovina 4",
            City = "Novi Sad"
        };
        var handler = new CreateOwnerCommandHandler(context);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Owner owner = await context.Owners.SingleAsync(o => o.Id == result.Value);
        owner.FirstName.ShouldBe("Ana");
        owner.LastName.ShouldBe("Petrović");
        owner.PhoneNumber.ShouldBe("064/1234567");
        owner.Address.ShouldBe("Zmaj Jovina 4");
        owner.City.ShouldBe("Novi Sad");
        owner.DomainEvents.ShouldContain(e => e is OwnerCreatedDomainEvent);
    }

    [Fact]
    public async Task Handle_Should_NormalizeEmailToLowercase_WhenEmailProvided()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();

        var command = new CreateOwnerCommand
        {
            FirstName = "Ana",
            LastName = "Petrović",
            PhoneNumber = "064/1234567",
            Address = "Zmaj Jovina 4",
            City = "Novi Sad",
            Email = "  Ana.Petrovic@Email.COM "
        };
        var handler = new CreateOwnerCommandHandler(context);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Owner owner = await context.Owners.SingleAsync(o => o.Id == result.Value);
        owner.Email.ShouldBe("ana.petrovic@email.com");
    }

    [Fact]
    public async Task Handle_Should_Fail_WhenEmailAlreadyExistsCaseInsensitively()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();

        context.Owners.Add(Owner.Create("Ana", "Petrović", "064/1234567", "Zmaj Jovina 4", "Novi Sad", "ana@email.com"));
        await context.SaveChangesAsync();

        var command = new CreateOwnerCommand
        {
            FirstName = "Marko",
            LastName = "Ilić",
            PhoneNumber = "063/7654321",
            Address = "Bulevar 10",
            City = "Beograd",
            Email = "ANA@email.com"
        };
        var handler = new CreateOwnerCommandHandler(context);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OwnerErrors.EmailNotUnique);
    }
}
