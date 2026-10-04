using Application.Abstractions.Authentication;
using Application.Abstractions.Clinic;
using Application.Users.Register;
using Application.UnitTests.Abstractions;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Users;

public sealed class RegisterUserCommandHandlerTests : BaseHandlerTest
{
    private static RegisterUserCommand Command =>
        new("test@example.com", "Test", "User", "Password123");

    private static IClinicSettings ClinicWithVeterinarians(params string[] emails)
    {
        IClinicSettings settings = Substitute.For<IClinicSettings>();
        settings.IsVeterinarianEmail(Arg.Any<string>())
            .Returns(call => emails.Contains(call.Arg<string>(), StringComparer.OrdinalIgnoreCase));

        return settings;
    }

    [Fact]
    public async Task Handle_Should_ReturnConflict_WhenEmailIsNotUnique()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        context.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = Command.Email,
            FirstName = "Existing",
            LastName = "User",
            PasswordHash = "hash"
        });
        await context.SaveChangesAsync();

        var handler = new RegisterUserCommandHandler(context, Substitute.For<IPasswordHasher>(), ClinicWithVeterinarians());

        // Act
        Result<Guid> result = await handler.Handle(Command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailNotUnique);
    }

    [Fact]
    public async Task Handle_Should_CreateClientWithHashedPasswordAndRaiseDomainEvent_WhenValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();

        IPasswordHasher passwordHasher = Substitute.For<IPasswordHasher>();
        passwordHasher.Hash(Command.Password).Returns("hashed-password");

        var handler = new RegisterUserCommandHandler(context, passwordHasher, ClinicWithVeterinarians());

        // Act
        Result<Guid> result = await handler.Handle(Command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        User user = await context.Users.SingleAsync(u => u.Id == result.Value);
        user.Email.ShouldBe(Command.Email);
        user.PasswordHash.ShouldBe("hashed-password");
        user.Role.ShouldBe(Role.Client);
        user.DomainEvents.ShouldContain(domainEvent => domainEvent is UserRegisteredDomainEvent);
    }

    [Fact]
    public async Task Handle_Should_GrantVeterinarianRole_WhenEmailIsAllowlisted()
    {
        // Arrange — the allowlist is the only route to the vet role, and it is case-insensitive.
        await using TestDbContext context = CreateDbContext();
        var handler = new RegisterUserCommandHandler(
            context, Substitute.For<IPasswordHasher>(), ClinicWithVeterinarians("VET@clinic.test"));

        // Act
        Result<Guid> result = await handler.Handle(
            new RegisterUserCommand("vet@clinic.test", "Jelena", "Jovanović", "Password123"), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        User user = await context.Users.SingleAsync(u => u.Id == result.Value);
        user.Role.ShouldBe(Role.Veterinarian);
    }
}
