using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Breeds;

public sealed class BreedsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private static object ValidRequest(string name = "Labrador", int species = 0) => new { name, species };

    [Fact]
    public async Task CreateBreed_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("breeds", ValidRequest());

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateBreed_Should_CreateBreed_WhenNoneExists()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("breeds", ValidRequest($"Nemački ovčar {Guid.NewGuid()}"));

        // Assert
        response.EnsureSuccessStatusCode();
        Guid breedId = await response.Content.ReadFromJsonAsync<Guid>();
        breedId.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreateBreed_Should_ReturnExistingBreedId_WhenSameNameAndSpeciesAlreadyExist()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string name = $"Mops {Guid.NewGuid()}";

        HttpResponseMessage firstResponse = await HttpClient.PostAsJsonAsync("breeds", ValidRequest(name));
        firstResponse.EnsureSuccessStatusCode();
        Guid firstId = await firstResponse.Content.ReadFromJsonAsync<Guid>();

        // Act — different casing and surrounding whitespace, same species
        HttpResponseMessage secondResponse = await HttpClient.PostAsJsonAsync("breeds", ValidRequest($"  {name.ToUpperInvariant()}  "));

        // Assert
        secondResponse.EnsureSuccessStatusCode();
        Guid secondId = await secondResponse.Content.ReadFromJsonAsync<Guid>();
        secondId.ShouldBe(firstId);
    }

    [Fact]
    public async Task CreateBreed_Should_CreateSeparateBreed_WhenSameNameButDifferentSpecies()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string name = $"Ostalo {Guid.NewGuid()}";

        HttpResponseMessage dogResponse = await HttpClient.PostAsJsonAsync("breeds", ValidRequest(name, species: 0));
        dogResponse.EnsureSuccessStatusCode();
        Guid dogBreedId = await dogResponse.Content.ReadFromJsonAsync<Guid>();

        // Act — same name, species = Cat (1) instead of Dog (0)
        HttpResponseMessage catResponse = await HttpClient.PostAsJsonAsync("breeds", ValidRequest(name, species: 1));

        // Assert
        catResponse.EnsureSuccessStatusCode();
        Guid catBreedId = await catResponse.Content.ReadFromJsonAsync<Guid>();
        catBreedId.ShouldNotBe(dogBreedId);
    }
}
