using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Appointments;

public sealed class AppointmentLifecycleTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private sealed record AppointmentDto(Guid Id, Guid? OwnerId, Guid? PatientId, DateTime StartsAt, int Status);

    private sealed record CheckInDto(Guid OwnerId, Guid PatientId);

    // A Thursday about seven weeks out, so lifecycle slots never collide with the other test classes.
    private static DateTime FutureThursdayNineUtc(int weekOffset = 0)
    {
        DateTime date = DateTime.UtcNow.Date.AddDays(49 + weekOffset * 7);
        while (date.DayOfWeek != DayOfWeek.Thursday)
        {
            date = date.AddDays(1);
        }

        return new DateTime(date.Year, date.Month, date.Day, 9, 0, 0, DateTimeKind.Utc);
    }

    private async Task<Guid> BookAsync(DateTime startsAt, int type = 0)
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("appointments", new
        {
            startsAt,
            durationMinutes = 30,
            type,
            reason = "test"
        });
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    private async Task<Guid> CreateBreedAsync()
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("breeds", new { name = $"Breed {Guid.NewGuid():N}", species = 0 });
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<Guid>();
    }

    [Fact]
    public async Task CheckIn_Should_CreateOwnerAndPatient_ForAThinBooking()
    {
        // Arrange — a vet books with neither owner nor patient, as an online self-booking would look.
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid breedId = await CreateBreedAsync();
        Guid appointmentId = await BookAsync(FutureThursdayNineUtc());

        // Act — the animal arrives; the vet enters both from the check-in screen.
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync($"appointments/{appointmentId}/check-in", new
        {
            owner = new { create = new { firstName = "Marko", lastName = "Ilić", phoneNumber = "064 123", address = "Bulevar 1", city = "Novi Sad", email = (string?)null } },
            patient = new { create = new { breedId, cardNumber = $"D26-{Guid.NewGuid():N}"[..12], name = "Luna", sex = 1 } }
        });

        // Assert
        response.EnsureSuccessStatusCode();
        CheckInDto? resolved = await response.Content.ReadFromJsonAsync<CheckInDto>();
        resolved.ShouldNotBeNull();

        AppointmentDto? appointment = await HttpClient.GetFromJsonAsync<AppointmentDto>($"appointments/{appointmentId}");
        appointment.ShouldNotBeNull();
        appointment.Status.ShouldBe(1); // CheckedIn
        appointment.OwnerId.ShouldBe(resolved.OwnerId);
        appointment.PatientId.ShouldBe(resolved.PatientId);
    }

    [Fact]
    public async Task CheckIn_Should_BeForbidden_ForClients()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync($"appointments/{Guid.NewGuid()}/check-in", new { });

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task MarkNoShow_Should_CloseTheAppointment()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid appointmentId = await BookAsync(FutureThursdayNineUtc().AddHours(1));

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync($"appointments/{appointmentId}/no-show", new { note = "no call" });

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        AppointmentDto? appointment = await HttpClient.GetFromJsonAsync<AppointmentDto>($"appointments/{appointmentId}");
        appointment!.Status.ShouldBe(3); // NoShow
    }

    [Fact]
    public async Task Cancel_Should_ReleaseTheSlot_SoItCanBeBookedAgain()
    {
        // The exclusion constraint filters on active statuses, so a cancelled booking must free its time.
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime slot = FutureThursdayNineUtc().AddHours(2);
        Guid first = await BookAsync(slot);

        HttpResponseMessage cancel = await HttpClient.PostAsJsonAsync($"appointments/{first}/cancel", new { reason = "moved" });
        cancel.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        Guid second = await BookAsync(slot);
        second.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Cancel_Should_Succeed_ForAClientsOwnBooking()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        Guid appointmentId = await BookAsync(FutureThursdayNineUtc().AddHours(3), type: 1);

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync($"appointments/{appointmentId}/cancel", new { reason = "can't make it" });

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Reschedule_Should_ReturnConflict_WhenTargetSlotIsTaken()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime blocker = FutureThursdayNineUtc(weekOffset: 1);
        await BookAsync(blocker);
        Guid moving = await BookAsync(blocker.AddHours(1));

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync($"appointments/{moving}/reschedule", new { startsAt = blocker });

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetUnresolved_Should_ListPastScheduledAppointments_ForVetsOnly()
    {
        // Arrange — a booking in the past that nobody closed out.
        (_, AccessTokens vet) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(vet.AccessToken);
        DateTime past = DateTime.UtcNow.Date.AddDays(-40).AddHours(9);
        Guid stale = await BookAsync(past);

        // Act / Assert — the vet sees it.
        List<AppointmentDto>? unresolved = await HttpClient.GetFromJsonAsync<List<AppointmentDto>>("appointments/unresolved");
        unresolved.ShouldNotBeNull();
        unresolved.ShouldContain(a => a.Id == stale);

        // A client is refused outright.
        (_, AccessTokens client) = await RegisterAndLoginAsync();
        Authenticate(client.AccessToken);
        HttpResponseMessage response = await HttpClient.GetAsync("appointments/unresolved");
        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }
}
