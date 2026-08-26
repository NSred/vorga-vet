using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Patients;

public sealed class UpdatePatientTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private async Task<Guid> CreateOwnerAsync(string lastName = "Petrović")
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("owners", new
        {
            firstName = "Ana",
            lastName,
            phoneNumber = "064/1234567",
            address = "Zmaj Jovina 4",
            city = "Novi Sad"
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    private async Task<Guid> CreateBreedAsync(string name)
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("breeds", new { name, species = 0 });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    private async Task<Guid> CreatePatientAsync(Guid ownerId, Guid breedId, string cardNumber)
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("patients", new
        {
            ownerId,
            breedId,
            cardNumber,
            name = "Rex",
            sex = 0,
            allergenIds = Array.Empty<Guid>()
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    private static object UpdateRequest(Guid ownerId, Guid breedId, string cardNumber, string name = "Rex") => new
    {
        ownerId,
        breedId,
        cardNumber,
        name,
        sex = 0,
        allergenIds = Array.Empty<Guid>()
    };

    [Fact]
    public async Task UpdatePatient_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.PutAsJsonAsync(
            $"patients/{Guid.NewGuid()}",
            UpdateRequest(Guid.NewGuid(), Guid.NewGuid(), "12345"));

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdatePatient_Should_ReturnNotFound_WhenPatientDoesNotExist()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid ownerId = await CreateOwnerAsync();
        Guid breedId = await CreateBreedAsync($"Labrador {Guid.NewGuid()}");

        // Act
        HttpResponseMessage response = await HttpClient.PutAsJsonAsync(
            $"patients/{Guid.NewGuid()}",
            UpdateRequest(ownerId, breedId, Guid.NewGuid().ToString("N")[..10]));

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdatePatient_Should_UpdatePatient_WhenValid()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid ownerId = await CreateOwnerAsync();
        Guid breedId = await CreateBreedAsync($"Labrador {Guid.NewGuid()}");
        string originalCardNumber = Guid.NewGuid().ToString("N")[..10];
        Guid patientId = await CreatePatientAsync(ownerId, breedId, originalCardNumber);

        // Act
        HttpResponseMessage response = await HttpClient.PutAsJsonAsync(
            $"patients/{patientId}",
            UpdateRequest(ownerId, breedId, originalCardNumber, name: "Bobi"));

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        HttpResponseMessage getResponse = await HttpClient.GetAsync($"patients/{patientId}");
        getResponse.EnsureSuccessStatusCode();
        PatientDto? patient = await getResponse.Content.ReadFromJsonAsync<PatientDto>();
        patient.ShouldNotBeNull();
        patient.Name.ShouldBe("Bobi");
    }

    [Fact]
    public async Task UpdatePatient_Should_ReturnConflict_WhenCardNumberTakenByAnotherPatient()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid ownerId = await CreateOwnerAsync();
        Guid breedId = await CreateBreedAsync($"Labrador {Guid.NewGuid()}");
        Guid firstPatientId = await CreatePatientAsync(ownerId, breedId, Guid.NewGuid().ToString("N")[..10]);
        string secondCardNumber = Guid.NewGuid().ToString("N")[..10];
        await CreatePatientAsync(ownerId, breedId, secondCardNumber);

        // Act
        HttpResponseMessage response = await HttpClient.PutAsJsonAsync(
            $"patients/{firstPatientId}",
            UpdateRequest(ownerId, breedId, secondCardNumber));

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    private sealed record PatientDto(Guid Id, string Name);
}
