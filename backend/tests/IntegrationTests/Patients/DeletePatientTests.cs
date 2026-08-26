using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Patients;

public sealed class DeletePatientTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private async Task<Guid> CreatePatientAsync()
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
            allergenIds = Array.Empty<Guid>()
        });
        patientResponse.EnsureSuccessStatusCode();
        return await patientResponse.Content.ReadFromJsonAsync<Guid>();
    }

    [Fact]
    public async Task DeletePatient_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"patients/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeletePatient_Should_ReturnNotFound_WhenPatientDoesNotExist()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"patients/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeletePatient_Should_MarkPatientAsDeleted_WhenValid()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid patientId = await CreatePatientAsync();

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"patients/{patientId}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        HttpResponseMessage getResponse = await HttpClient.GetAsync($"patients/{patientId}");
        getResponse.EnsureSuccessStatusCode();
        PatientDto? patient = await getResponse.Content.ReadFromJsonAsync<PatientDto>();
        patient.ShouldNotBeNull();
        patient.IsDeleted.ShouldBeTrue();
    }

    [Fact]
    public async Task DeletePatient_Should_ReturnProblem_WhenAlreadyDeleted()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid patientId = await CreatePatientAsync();
        HttpResponseMessage firstDelete = await HttpClient.DeleteAsync($"patients/{patientId}");
        firstDelete.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Act
        HttpResponseMessage secondDelete = await HttpClient.DeleteAsync($"patients/{patientId}");

        // Assert
        secondDelete.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    private sealed record PatientDto(Guid Id, bool IsDeleted);
}
