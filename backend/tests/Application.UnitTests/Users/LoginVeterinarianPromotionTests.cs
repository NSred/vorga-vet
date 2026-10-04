using Application.Abstractions.Authentication;
using Application.Abstractions.Clinic;
using Application.Users;
using Application.Users.Login;
using Application.UnitTests.Abstractions;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Users;

/// <summary>
/// An account registered before its email was allowlisted heals itself at login, and the
/// token issued in that same login already carries the vet role.
/// </summary>
public sealed class LoginVeterinarianPromotionTests : BaseHandlerTest
{
    private const string Email = "vet@clinic.test";

    private static async Task<User> SeedClientAsync(TestDbContext context)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = Email,
            FirstName = "Jelena",
            LastName = "Jovanović",
            PasswordHash = "hash",
            Role = Role.Client
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user;
    }

    private static LoginUserCommandHandler CreateHandler(TestDbContext context, bool allowlisted)
    {
        IPasswordHasher passwordHasher = Substitute.For<IPasswordHasher>();
        passwordHasher.Verify("Password123", "hash").Returns(true);

        ITokenProvider tokenProvider = Substitute.For<ITokenProvider>();
        tokenProvider.Create(Arg.Is<User>(u => u.Role == Role.Veterinarian)).Returns("vet-token");
        tokenProvider.Create(Arg.Is<User>(u => u.Role == Role.Client)).Returns("client-token");
        tokenProvider.GenerateRefreshToken().Returns("refresh");

        IDateTimeProvider clock = Substitute.For<IDateTimeProvider>();
        clock.UtcNow.Returns(new DateTime(2026, 9, 16, 0, 0, 0, DateTimeKind.Utc));

        IClinicSettings settings = Substitute.For<IClinicSettings>();
        settings.IsVeterinarianEmail(Email).Returns(allowlisted);

        return new LoginUserCommandHandler(context, passwordHasher, tokenProvider, clock, settings);
    }

    [Fact]
    public async Task Handle_Should_PromoteAllowlistedClient_BeforeIssuingTheToken()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        User user = await SeedClientAsync(context);
        LoginUserCommandHandler handler = CreateHandler(context, allowlisted: true);

        // Act
        Result<AccessTokensResponse> result = await handler.Handle(
            new LoginUserCommand(Email, "Password123"), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.AccessToken.ShouldBe("vet-token");

        User persisted = await context.Users.SingleAsync(u => u.Id == user.Id);
        persisted.Role.ShouldBe(Role.Veterinarian);
    }

    [Fact]
    public async Task Handle_Should_LeaveRoleAlone_WhenEmailIsNotAllowlisted()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        User user = await SeedClientAsync(context);
        LoginUserCommandHandler handler = CreateHandler(context, allowlisted: false);

        // Act
        Result<AccessTokensResponse> result = await handler.Handle(
            new LoginUserCommand(Email, "Password123"), CancellationToken.None);

        // Assert
        result.Value.AccessToken.ShouldBe("client-token");
        (await context.Users.SingleAsync(u => u.Id == user.Id)).Role.ShouldBe(Role.Client);
    }
}
