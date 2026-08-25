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

    [Fact]
    public async Task SearchBreeds_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("breeds?species=0");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SearchBreeds_Should_FindBreed_ByNameSubstring_CaseInsensitive()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string name = $"Jazavičar {Guid.NewGuid()}";
        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync("breeds", ValidRequest(name, species: 0));
        createResponse.EnsureSuccessStatusCode();
        Guid breedId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act — uppercase substring against a title-case name
        HttpResponseMessage response = await HttpClient.GetAsync($"breeds?species=0&search=JAZAVI");

        // Assert
        response.EnsureSuccessStatusCode();
        List<BreedDto>? breeds = await response.Content.ReadFromJsonAsync<List<BreedDto>>();
        breeds.ShouldNotBeNull();
        breeds.ShouldContain(b => b.Id == breedId);
    }

    [Fact]
    public async Task SearchBreeds_Should_NotReturnBreed_WhenQueriedUnderADifferentSpecies()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string name = $"Persijska {Guid.NewGuid()}";
        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync("breeds", ValidRequest(name, species: 1));
        createResponse.EnsureSuccessStatusCode();
        Guid breedId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act — same search term, but species = Dog (0) instead of the Cat (1) it was created under
        HttpResponseMessage response = await HttpClient.GetAsync($"breeds?species=0&search={Uri.EscapeDataString(name)}");

        // Assert
        response.EnsureSuccessStatusCode();
        List<BreedDto>? breeds = await response.Content.ReadFromJsonAsync<List<BreedDto>>();
        breeds.ShouldNotBeNull();
        breeds.ShouldNotContain(b => b.Id == breedId);
    }

    private sealed record BreedDto(Guid Id, string Name);
}
