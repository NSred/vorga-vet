using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Allergens;

public sealed class AllergensTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private static object ValidRequest(string name) => new { name };

    [Fact]
    public async Task CreateAllergen_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("allergens", ValidRequest("Pollen"));

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateAllergen_Should_CreateAllergen_WhenNoneExists()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("allergens", ValidRequest($"Amoxicillin {Guid.NewGuid()}"));

        // Assert
        response.EnsureSuccessStatusCode();
        Guid allergenId = await response.Content.ReadFromJsonAsync<Guid>();
        allergenId.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreateAllergen_Should_ReturnExistingAllergenId_WhenSameNameAlreadyExists()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string name = $"Chicken protein {Guid.NewGuid()}";

        HttpResponseMessage firstResponse = await HttpClient.PostAsJsonAsync("allergens", ValidRequest(name));
        firstResponse.EnsureSuccessStatusCode();
        Guid firstId = await firstResponse.Content.ReadFromJsonAsync<Guid>();

        // Act — different casing and surrounding whitespace
        HttpResponseMessage secondResponse = await HttpClient.PostAsJsonAsync("allergens", ValidRequest($"  {name.ToUpperInvariant()}  "));

        // Assert
        secondResponse.EnsureSuccessStatusCode();
        Guid secondId = await secondResponse.Content.ReadFromJsonAsync<Guid>();
        secondId.ShouldBe(firstId);
    }

    [Fact]
    public async Task SearchAllergens_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("allergens?search=pollen");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SearchAllergens_Should_FindAllergen_ByNameSubstring_CaseInsensitive()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string name = $"Ragweed pollen {Guid.NewGuid()}";
        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync("allergens", ValidRequest(name));
        createResponse.EnsureSuccessStatusCode();
        Guid allergenId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act — uppercase substring against a lowercase name
        HttpResponseMessage response = await HttpClient.GetAsync("allergens?search=RAGWEED");

        // Assert
        response.EnsureSuccessStatusCode();
        List<AllergenDto>? allergens = await response.Content.ReadFromJsonAsync<List<AllergenDto>>();
        allergens.ShouldNotBeNull();
        allergens.ShouldContain(a => a.Id == allergenId);
    }

    [Fact]
    public async Task SearchAllergens_Should_ReturnEmptyList_WhenSearchTermMatchesNoAllergen()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("allergens?search=nonexistentxyz");

        // Assert
        response.EnsureSuccessStatusCode();
        List<AllergenDto>? allergens = await response.Content.ReadFromJsonAsync<List<AllergenDto>>();
        allergens.ShouldNotBeNull();
        allergens.ShouldBeEmpty();
    }

    private sealed record AllergenDto(Guid Id, string Name);
}
