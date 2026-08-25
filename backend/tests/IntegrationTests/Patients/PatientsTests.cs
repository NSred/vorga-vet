using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Patients;

public sealed class PatientsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private async Task<(Guid OwnerId, Guid BreedId)> SeedOwnerAndBreedAsync()
    {
        HttpResponseMessage ownerResponse = await HttpClient.PostAsJsonAsync("owners", new
        {
            firstName = "Ana",
            lastName = "Petrović",
            phoneNumber = "064/1234567",
            address = "Zmaj Jovina 4",
            city = "Novi Sad"
        });
        ownerResponse.EnsureSuccessStatusCode();
        Guid ownerId = await ownerResponse.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage breedResponse = await HttpClient.PostAsJsonAsync("breeds", new
        {
            name = $"Labrador {Guid.NewGuid()}",
            species = 0
        });
        breedResponse.EnsureSuccessStatusCode();
        Guid breedId = await breedResponse.Content.ReadFromJsonAsync<Guid>();

        return (ownerId, breedId);
    }

    private static object ValidRequest(Guid ownerId, Guid breedId, string? cardNumber = null, List<Guid>? allergenIds = null) => new
    {
        ownerId,
        breedId,
        cardNumber = cardNumber ?? Guid.NewGuid().ToString("N")[..10],
        name = "Rex",
        sex = 0,
        allergenIds = allergenIds ?? []
    };

    [Fact]
    public async Task CreatePatient_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("patients", ValidRequest(Guid.NewGuid(), Guid.NewGuid()));

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreatePatient_Should_CreatePatient_WhenValid()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        (Guid ownerId, Guid breedId) = await SeedOwnerAndBreedAsync();

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("patients", ValidRequest(ownerId, breedId));

        // Assert
        response.EnsureSuccessStatusCode();
        Guid patientId = await response.Content.ReadFromJsonAsync<Guid>();
        patientId.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreatePatient_Should_CreatePatient_WhenAllergensProvided()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        (Guid ownerId, Guid breedId) = await SeedOwnerAndBreedAsync();

        HttpResponseMessage allergenResponse = await HttpClient.PostAsJsonAsync("allergens", new { name = $"Pollen {Guid.NewGuid()}" });
        allergenResponse.EnsureSuccessStatusCode();
        Guid allergenId = await allergenResponse.Content.ReadFromJsonAsync<Guid>();

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync(
            "patients",
            ValidRequest(ownerId, breedId, allergenIds: [allergenId]));

        // Assert
        response.EnsureSuccessStatusCode();
        Guid patientId = await response.Content.ReadFromJsonAsync<Guid>();
        patientId.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreatePatient_Should_ReturnConflict_WhenCardNumberAlreadyExists()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        (Guid ownerId, Guid breedId) = await SeedOwnerAndBreedAsync();

        string cardNumber = Guid.NewGuid().ToString("N")[..10];
        HttpResponseMessage firstResponse = await HttpClient.PostAsJsonAsync("patients", ValidRequest(ownerId, breedId, cardNumber));
        firstResponse.EnsureSuccessStatusCode();

        // Act
        HttpResponseMessage secondResponse = await HttpClient.PostAsJsonAsync("patients", ValidRequest(ownerId, breedId, cardNumber));

        // Assert
        secondResponse.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreatePatient_Should_ReturnNotFound_WhenOwnerDoesNotExist()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        (_, Guid breedId) = await SeedOwnerAndBreedAsync();

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("patients", ValidRequest(Guid.NewGuid(), breedId));

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
