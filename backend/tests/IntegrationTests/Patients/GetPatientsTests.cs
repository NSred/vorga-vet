using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Patients;

public sealed class GetPatientsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private async Task<Guid> SeedPatientAsync(string ownerLastName, string breedName, string patientName)
    {
        HttpResponseMessage ownerResponse = await HttpClient.PostAsJsonAsync("owners", new
        {
            firstName = "Test",
            lastName = ownerLastName,
            phoneNumber = "064/1234567",
            address = "Zmaj Jovina 4",
            city = "Novi Sad"
        });
        ownerResponse.EnsureSuccessStatusCode();
        Guid ownerId = await ownerResponse.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage breedResponse = await HttpClient.PostAsJsonAsync("breeds", new { name = breedName, species = 0 });
        breedResponse.EnsureSuccessStatusCode();
        Guid breedId = await breedResponse.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage patientResponse = await HttpClient.PostAsJsonAsync("patients", new
        {
            ownerId,
            breedId,
            cardNumber = Guid.NewGuid().ToString("N")[..10],
            name = patientName,
            sex = 0,
            allergenIds = Array.Empty<Guid>()
        });
        patientResponse.EnsureSuccessStatusCode();
        return await patientResponse.Content.ReadFromJsonAsync<Guid>();
    }

    [Fact]
    public async Task GetPatients_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("patients");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetPatients_Should_FindPatient_ByOwnerLastNameSubstring()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string uniqueLastName = $"Petrovic{Guid.NewGuid():N}";
        Guid patientId = await SeedPatientAsync(uniqueLastName, $"Labrador {Guid.NewGuid()}", "Rex");

        // Act — search matches only part of the owner's last name, uppercase against the stored value
        HttpResponseMessage response = await HttpClient.GetAsync($"patients?search={uniqueLastName.ToUpperInvariant()[..10]}");

        // Assert
        response.EnsureSuccessStatusCode();
        GetPatientsResponseDto? result = await response.Content.ReadFromJsonAsync<GetPatientsResponseDto>();
        result.ShouldNotBeNull();
        result.Items.ShouldContain(p => p.Id == patientId);
    }

    [Fact]
    public async Task GetPatients_Should_FindPatient_ByBreedNameSubstring()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string uniqueBreedName = $"Jazavicar{Guid.NewGuid():N}";
        Guid patientId = await SeedPatientAsync($"Owner{Guid.NewGuid()}", uniqueBreedName, "Mila");

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"patients?search={uniqueBreedName[..10]}");

        // Assert
        response.EnsureSuccessStatusCode();
        GetPatientsResponseDto? result = await response.Content.ReadFromJsonAsync<GetPatientsResponseDto>();
        result.ShouldNotBeNull();
        result.Items.ShouldContain(p => p.Id == patientId);
    }

    [Fact]
    public async Task GetPatients_Should_ReturnEmptyItems_WhenSearchTermMatchesNoPatient()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("patients?search=nonexistentxyzpatient");

        // Assert
        response.EnsureSuccessStatusCode();
        GetPatientsResponseDto? result = await response.Content.ReadFromJsonAsync<GetPatientsResponseDto>();
        result.ShouldNotBeNull();
        result.Items.ShouldBeEmpty();
    }

    private sealed record PatientDto(Guid Id, string Name);

    private sealed record GetPatientsResponseDto(List<PatientDto> Items, int TotalCount, int Page, int PageSize);
}
