using System.Net;

namespace IntegrationTests.Users;

public sealed class VeterinarianAllowlistTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    [Fact]
    public async Task Register_Should_GrantVeterinarianRole_WhenEmailIsAllowlisted()
    {
        // Arrange — plain registration, no database edit, no special endpoint.
        const string email = IntegrationTestWebAppFactory.AllowlistedVeterinarianEmail;
        await RegisterUserAsync(email);
        AccessTokens tokens = await LoginAsync(email);
        Authenticate(tokens.AccessToken);

        // Act — a vet-only endpoint.
        HttpResponseMessage response = await HttpClient.GetAsync("appointments/unresolved");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Register_Should_GrantClientRole_ForAnyOtherEmail()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage response = await HttpClient.GetAsync("appointments/unresolved");

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }
}
