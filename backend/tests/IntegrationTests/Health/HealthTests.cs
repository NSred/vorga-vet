using System.Net;

namespace IntegrationTests.Health;

public sealed class HealthTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    [Fact]
    public async Task Live_Should_ReturnHealthy()
    {
        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("health/live");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldBe("Healthy");
    }
}
