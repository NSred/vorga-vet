using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace IntegrationTests.Examinations;

public sealed class AttachmentsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private sealed record AttachmentDto(Guid Id, int Kind, string FileName, string ContentType, long SizeBytes);

    private sealed record ExaminationDto(Guid Id, List<AttachmentDto> Attachments);

    // The smallest valid PNG: a 1x1 transparent pixel.
    private static readonly byte[] OnePixelPng = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

    private async Task<Guid> SeedWalkInExaminationAsync()
    {
        HttpResponseMessage ownerResponse = await HttpClient.PostAsJsonAsync("owners", new
        {
            firstName = "Ana", lastName = "Petrović", phoneNumber = "063/1", address = "Zmaj Jovina 4", city = "Novi Sad"
        });
        ownerResponse.EnsureSuccessStatusCode();
        Guid ownerId = await ownerResponse.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage breedResponse = await HttpClient.PostAsJsonAsync("breeds", new { name = $"Breed {Guid.NewGuid():N}", species = 0 });
        breedResponse.EnsureSuccessStatusCode();
        Guid breedId = await breedResponse.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage patientResponse = await HttpClient.PostAsJsonAsync("patients", new
        {
            ownerId, breedId, cardNumber = $"A{Guid.NewGuid():N}"[..12], name = "Rex", sex = 0, allergenIds = Array.Empty<Guid>()
        });
        patientResponse.EnsureSuccessStatusCode();
        Guid patientId = await patientResponse.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage examinationResponse = await HttpClient.PostAsJsonAsync("examinations", new
        {
            patientId,
            examination = new { performedByFirstName = "Jelena", performedByLastName = "Jovanović", cost = 1000m }
        });
        examinationResponse.EnsureSuccessStatusCode();

        return await examinationResponse.Content.ReadFromJsonAsync<Guid>();
    }

    [SuppressMessage("Reliability", "CA2000:Dispose objects before losing scope",
        Justification = "Ownership of the parts transfers to the MultipartFormDataContent, which disposes them.")]
    private static MultipartFormDataContent ImageUpload(byte[] bytes, string contentType, string fileName, int kind)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        return new MultipartFormDataContent
        {
            { file, "file", fileName },
            { new StringContent(kind.ToString(CultureInfo.InvariantCulture)), "kind" }
        };
    }

    [Fact]
    public async Task UploadListDownloadDelete_Should_RoundTripAnXray()
    {
        // Arrange
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid examinationId = await SeedWalkInExaminationAsync();

        // Act — upload
        using MultipartFormDataContent upload = ImageUpload(OnePixelPng, "image/png", "thorax.png", kind: 0);
        HttpResponseMessage uploaded = await HttpClient.PostAsync($"examinations/{examinationId}/attachments", upload);

        // Assert — recorded on the examination
        uploaded.EnsureSuccessStatusCode();
        Guid attachmentId = await uploaded.Content.ReadFromJsonAsync<Guid>();

        ExaminationDto? examination = await HttpClient.GetFromJsonAsync<ExaminationDto>($"examinations/{examinationId}");
        examination.ShouldNotBeNull();
        AttachmentDto listed = examination.Attachments.ShouldHaveSingleItem();
        listed.Id.ShouldBe(attachmentId);
        listed.Kind.ShouldBe(0);
        listed.FileName.ShouldBe("thorax.png");
        listed.SizeBytes.ShouldBe(OnePixelPng.Length);

        // The bytes come back exactly, with the right type.
        HttpResponseMessage download = await HttpClient.GetAsync($"attachments/{attachmentId}");
        download.EnsureSuccessStatusCode();
        download.Content.Headers.ContentType!.MediaType.ShouldBe("image/png");
        (await download.Content.ReadAsByteArrayAsync()).ShouldBe(OnePixelPng);

        // Delete removes both the record and the content.
        HttpResponseMessage deleted = await HttpClient.DeleteAsync($"examinations/{examinationId}/attachments/{attachmentId}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        HttpResponseMessage gone = await HttpClient.GetAsync($"attachments/{attachmentId}");
        gone.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Upload_Should_RejectANonImage()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid examinationId = await SeedWalkInExaminationAsync();

        using MultipartFormDataContent upload = ImageUpload([1, 2, 3], "text/plain", "notes.txt", kind: 0);
        HttpResponseMessage response = await HttpClient.PostAsync($"examinations/{examinationId}/attachments", upload);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Upload_Should_BeForbidden_ForClients()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        using MultipartFormDataContent upload = ImageUpload(OnePixelPng, "image/png", "x.png", kind: 0);
        HttpResponseMessage response = await HttpClient.PostAsync($"examinations/{Guid.NewGuid()}/attachments", upload);

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }
}
