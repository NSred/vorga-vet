using System.Net.Http.Headers;
using System.Net.Http.Json;
using Domain.Users;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests;

[Collection(nameof(IntegrationTestCollection))]
public abstract class BaseIntegrationTest
{
    private readonly IntegrationTestWebAppFactory _factory;

    protected BaseIntegrationTest(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
        HttpClient = factory.CreateClient();
    }

    protected HttpClient HttpClient { get; }

    protected sealed record AccessTokens(string AccessToken, string RefreshToken);

    protected static string UniqueEmail() => $"test-{Guid.NewGuid():N}@example.com";

    protected async Task<Guid> RegisterUserAsync(string email)
    {
        var request = new
        {
            email,
            firstName = "Test",
            lastName = "User",
            password = "Password123"
        };

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("users/register", request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    protected async Task<AccessTokens> LoginAsync(string email)
    {
        var request = new { email, password = "Password123" };

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("users/login", request);
        response.EnsureSuccessStatusCode();

        AccessTokens? tokens = await response.Content.ReadFromJsonAsync<AccessTokens>();

        return tokens!;
    }

    protected async Task<(Guid UserId, AccessTokens Tokens)> RegisterAndLoginAsync()
    {
        string email = UniqueEmail();
        Guid userId = await RegisterUserAsync(email);
        AccessTokens tokens = await LoginAsync(email);

        return (userId, tokens);
    }

    /// <summary>
    /// Registers a user, promotes them to <see cref="Role.Veterinarian"/> in the database, then logs
    /// in so the issued token carries the vet role. New registrations default to <see cref="Role.Client"/>.
    /// </summary>
    protected async Task<(Guid UserId, AccessTokens Tokens)> RegisterVeterinarianAndLoginAsync()
    {
        string email = UniqueEmail();
        Guid userId = await RegisterUserAsync(email);
        await SetRoleAsync(userId, Role.Veterinarian);
        AccessTokens tokens = await LoginAsync(email);

        return (userId, tokens);
    }

    protected async Task SetRoleAsync(Guid userId, Role role)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        User user = await dbContext.Users.SingleAsync(u => u.Id == userId);
        user.Role = role;
        await dbContext.SaveChangesAsync();
    }

    protected void Authenticate(string accessToken)
    {
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }
}
