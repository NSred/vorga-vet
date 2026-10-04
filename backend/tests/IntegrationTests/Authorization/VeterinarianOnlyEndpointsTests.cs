using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Authorization;

/// <summary>
/// The clinic's record-keeping surface is staff-only. A client can read their own patients and
/// appointments, book and cancel — but not write clinic records or browse other people's contact details.
/// </summary>
public sealed class VeterinarianOnlyEndpointsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    [Theory]
    [InlineData("POST", "patients")]
    [InlineData("PUT", "patients/{id}")]
    [InlineData("DELETE", "patients/{id}")]
    [InlineData("POST", "owners")]
    [InlineData("GET", "owners?search=a")]
    [InlineData("POST", "breeds")]
    [InlineData("POST", "allergens")]
    public async Task StaffEndpoints_Should_ReturnForbidden_ForClients(string method, string path)
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        string url = path.Replace("{id}", Guid.NewGuid().ToString(), StringComparison.Ordinal);
        using var request = new HttpRequestMessage(new HttpMethod(method), url);

        if (method is "POST" or "PUT")
        {
            request.Content = JsonContent.Create(new { });
        }

        // Act
        HttpResponseMessage response = await HttpClient.SendAsync(request);

        // Assert — authorization runs before binding, so an empty body is fine here.
        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClientReadEndpoints_Should_StayOpen_ToClients()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage patients = await HttpClient.GetAsync("patients");
        HttpResponseMessage breeds = await HttpClient.GetAsync("breeds?species=0&search=a");

        patients.StatusCode.ShouldBe(HttpStatusCode.OK);
        breeds.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
