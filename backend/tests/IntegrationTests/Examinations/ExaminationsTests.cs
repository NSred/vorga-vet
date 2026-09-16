using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Examinations;

public sealed class ExaminationsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private sealed record ExaminationDto(
        Guid Id, Guid PatientId, Guid? AppointmentId, string PerformedByLastName, decimal? Cost, bool IsPaid, DateTime? PaidAt);

    private sealed record AppointmentDto(Guid Id, int Status);

    private sealed record CheckInDto(Guid OwnerId, Guid PatientId);

    private static object Details(decimal cost = 3500m) => new
    {
        performedByFirstName = "Jelena",
        performedByLastName = "Jovanović",
        anamnesis = "Vomiting since yesterday",
        diagnosis = "Gastritis",
        therapy = "Diet + omeprazole",
        cost
    };

    // A Wednesday about ten weeks out, disjoint from the other test classes' slots.
    private static DateTime FutureWednesdayNineUtc(int hourOffset = 0)
    {
        DateTime date = DateTime.UtcNow.Date.AddDays(70);
        while (date.DayOfWeek != DayOfWeek.Wednesday)
        {
            date = date.AddDays(1);
        }

        return new DateTime(date.Year, date.Month, date.Day, 9 + hourOffset, 0, 0, DateTimeKind.Utc);
    }

    private async Task<Guid> CreateBreedAsync()
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("breeds", new { name = $"Breed {Guid.NewGuid():N}", species = 0 });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    private async Task<Guid> BookAsync(DateTime startsAt)
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("appointments", new
        {
            startsAt,
            durationMinutes = 30,
            type = 1,
            reason = "checkup"
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    [Fact]
    public async Task BookCheckInCompletePay_Should_FlowEndToEnd()
    {
        // Arrange — book, then check in with a brand-new owner and patient.
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid breedId = await CreateBreedAsync();
        Guid appointmentId = await BookAsync(FutureWednesdayNineUtc());

        HttpResponseMessage checkIn = await HttpClient.PostAsJsonAsync($"appointments/{appointmentId}/check-in", new
        {
            owner = new { create = new { firstName = "Marko", lastName = "Ilić", phoneNumber = "064 123", address = "Bulevar 1", city = "Novi Sad", email = (string?)null } },
            patient = new { create = new { breedId, cardNumber = $"E{Guid.NewGuid():N}"[..12], name = "Luna", sex = 1 } }
        });
        checkIn.EnsureSuccessStatusCode();
        CheckInDto resolved = (await checkIn.Content.ReadFromJsonAsync<CheckInDto>())!;

        // Act — complete carries the examination payload.
        HttpResponseMessage complete = await HttpClient.PostAsJsonAsync(
            $"appointments/{appointmentId}/complete", new { examination = Details() });

        // Assert — one call produced the examination and closed the appointment.
        complete.EnsureSuccessStatusCode();
        Guid examinationId = await complete.Content.ReadFromJsonAsync<Guid>();

        ExaminationDto? examination = await HttpClient.GetFromJsonAsync<ExaminationDto>($"examinations/{examinationId}");
        examination.ShouldNotBeNull();
        examination.AppointmentId.ShouldBe(appointmentId);
        examination.PatientId.ShouldBe(resolved.PatientId);
        examination.Cost.ShouldBe(3500m);
        examination.IsPaid.ShouldBeFalse();

        AppointmentDto? appointment = await HttpClient.GetFromJsonAsync<AppointmentDto>($"appointments/{appointmentId}");
        appointment!.Status.ShouldBe(2); // Completed

        // Pay, then it reads as settled and shows up on the patient's timeline.
        HttpResponseMessage pay = await HttpClient.PostAsync($"examinations/{examinationId}/pay", content: null);
        pay.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        ExaminationDto? paid = await HttpClient.GetFromJsonAsync<ExaminationDto>($"examinations/{examinationId}");
        paid!.IsPaid.ShouldBeTrue();
        paid.PaidAt.ShouldNotBeNull();

        List<ExaminationDto>? timeline =
            await HttpClient.GetFromJsonAsync<List<ExaminationDto>>($"patients/{resolved.PatientId}/examinations");
        timeline.ShouldNotBeNull();
        timeline.ShouldContain(e => e.Id == examinationId);
    }

    [Fact]
    public async Task Complete_Should_Fail_WhenBookingIsThinAndNoResolutionIsGiven()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid appointmentId = await BookAsync(FutureWednesdayNineUtc(hourOffset: 1));

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync(
            $"appointments/{appointmentId}/complete", new { examination = Details() });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateExamination_Should_RecordAWalkIn_AgainstAnExistingPatient()
    {
        // Arrange — a patient that exists already, no appointment involved.
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage ownerResponse = await HttpClient.PostAsJsonAsync("owners", new
        {
            firstName = "Ana", lastName = "Petrović", phoneNumber = "063/1", address = "Zmaj Jovina 4", city = "Novi Sad"
        });
        ownerResponse.EnsureSuccessStatusCode();
        Guid ownerId = await ownerResponse.Content.ReadFromJsonAsync<Guid>();
        Guid breedId = await CreateBreedAsync();

        HttpResponseMessage patientResponse = await HttpClient.PostAsJsonAsync("patients", new
        {
            ownerId, breedId, cardNumber = $"W{Guid.NewGuid():N}"[..12], name = "Rex", sex = 0, allergenIds = Array.Empty<Guid>()
        });
        patientResponse.EnsureSuccessStatusCode();
        Guid patientId = await patientResponse.Content.ReadFromJsonAsync<Guid>();

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("examinations", new { patientId, examination = Details(1200m) });

        // Assert
        response.EnsureSuccessStatusCode();
        Guid examinationId = await response.Content.ReadFromJsonAsync<Guid>();
        ExaminationDto? examination = await HttpClient.GetFromJsonAsync<ExaminationDto>($"examinations/{examinationId}");
        examination!.AppointmentId.ShouldBeNull();
        examination.PatientId.ShouldBe(patientId);
    }

    [Fact]
    public async Task ExaminationEndpoints_Should_BeForbidden_ForClients()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage create = await HttpClient.PostAsJsonAsync("examinations", new { patientId = Guid.NewGuid(), examination = Details() });
        HttpResponseMessage read = await HttpClient.GetAsync($"examinations/{Guid.NewGuid()}");

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        read.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }
}
