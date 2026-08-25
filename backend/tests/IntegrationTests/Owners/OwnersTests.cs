using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Owners;

public sealed class OwnersTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private static object ValidRequest() => new
    {
        firstName = "Ana",
        lastName = "Petrović",
        phoneNumber = "064/1234567",
        address = "Zmaj Jovina 4",
        city = "Novi Sad"
    };

    [Fact]
    public async Task CreateOwner_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("owners", ValidRequest());

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateOwner_Should_CreateOwner_WhenValid()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("owners", ValidRequest());

        // Assert
        response.EnsureSuccessStatusCode();
        Guid ownerId = await response.Content.ReadFromJsonAsync<Guid>();
        ownerId.ShouldNotBe(Guid.Empty);
    }
}
