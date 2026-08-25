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

    [Fact]
    public async Task SearchOwners_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("owners?search=ana");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SearchOwners_Should_FindOwner_ByLastNameSubstring()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync("owners", ValidRequest());
        createResponse.EnsureSuccessStatusCode();
        Guid ownerId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("owners?search=petrovi");

        // Assert
        response.EnsureSuccessStatusCode();
        List<OwnerDto>? owners = await response.Content.ReadFromJsonAsync<List<OwnerDto>>();
        owners.ShouldNotBeNull();
        owners.ShouldContain(o => o.Id == ownerId);
    }

    [Fact]
    public async Task SearchOwners_Should_FindOwner_ByFirstNameSubstring_CaseInsensitive()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync("owners", ValidRequest());
        createResponse.EnsureSuccessStatusCode();
        Guid ownerId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act — uppercase term against a lowercase name, to also confirm ILike's casing behavior
        HttpResponseMessage response = await HttpClient.GetAsync("owners?search=AN");

        // Assert
        response.EnsureSuccessStatusCode();
        List<OwnerDto>? owners = await response.Content.ReadFromJsonAsync<List<OwnerDto>>();
        owners.ShouldNotBeNull();
        owners.ShouldContain(o => o.Id == ownerId);
    }

    [Fact]
    public async Task SearchOwners_Should_ReturnEmptyList_WhenSearchTermMatchesNoOwner()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync("owners", ValidRequest());
        createResponse.EnsureSuccessStatusCode();

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("owners?search=nonexistentxyz");

        // Assert
        response.EnsureSuccessStatusCode();
        List<OwnerDto>? owners = await response.Content.ReadFromJsonAsync<List<OwnerDto>>();
        owners.ShouldNotBeNull();
        owners.ShouldBeEmpty();
    }

    private sealed record OwnerDto(Guid Id, string FirstName, string LastName, string PhoneNumber);
}
