using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Patients;

public sealed class GetPatientByIdTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private async Task<(Guid PatientId, Guid OwnerId, Guid BreedId)> SeedPatientAsync()
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

        HttpResponseMessage breedResponse = await HttpClient.PostAsJsonAsync("breeds", new { name = $"Labrador {Guid.NewGuid()}", species = 0 });
        breedResponse.EnsureSuccessStatusCode();
        Guid breedId = await breedResponse.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage patientResponse = await HttpClient.PostAsJsonAsync("patients", new
        {
            ownerId,
            breedId,
            cardNumber = Guid.NewGuid().ToString("N")[..10],
            name = "Rex",
            sex = 0,
            anamnesis = "Healthy",
            allergenIds = Array.Empty<Guid>()
        });
        patientResponse.EnsureSuccessStatusCode();
        Guid patientId = await patientResponse.Content.ReadFromJsonAsync<Guid>();

        return (patientId, ownerId, breedId);
    }

    [Fact]
    public async Task GetPatientById_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"patients/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetPatientById_Should_ReturnNotFound_WhenPatientDoesNotExist()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"patients/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetPatientById_Should_ReturnPatientDetails_WhenPatientExists()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        (Guid patientId, Guid ownerId, Guid breedId) = await SeedPatientAsync();

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"patients/{patientId}");

        // Assert
        response.EnsureSuccessStatusCode();
        PatientDetailDto? result = await response.Content.ReadFromJsonAsync<PatientDetailDto>();
        result.ShouldNotBeNull();
        result.Id.ShouldBe(patientId);
        result.OwnerId.ShouldBe(ownerId);
        result.BreedId.ShouldBe(breedId);
        result.Name.ShouldBe("Rex");
        result.Anamnesis.ShouldBe("Healthy");
        result.OwnerName.ShouldBe("Ana Petrović");
    }

    private sealed record PatientDetailDto(
        Guid Id,
        Guid OwnerId,
        Guid BreedId,
        string Name,
        string? Anamnesis,
        string OwnerName);
}
