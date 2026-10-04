using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Appointments;

public sealed class AvailabilityTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private sealed record SlotDto(DateTime StartsAt, DateTime EndsAt, bool IsAvailable, bool IsMine);

    // A weekday far enough out to be untouched by other tests; 09:00 Belgrade in September is 07:00 UTC.
    private static DateTime NextTuesdayUtcMidnight()
    {
        DateTime date = DateTime.UtcNow.Date.AddDays(30);
        while (date.DayOfWeek != DayOfWeek.Tuesday)
        {
            date = date.AddDays(1);
        }

        return DateTime.SpecifyKind(date, DateTimeKind.Utc);
    }

    [Fact]
    public async Task GetAvailability_Should_ReturnClinicSlots_WithBookedOnesTaken()
    {
        // Arrange — a vet books 09:00 Belgrade (07:00 UTC) on that Tuesday.
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime day = NextTuesdayUtcMidnight();
        DateTime booked = day.AddHours(7);

        HttpResponseMessage created = await HttpClient.PostAsJsonAsync("appointments", new
        {
            startsAt = booked,
            durationMinutes = 30,
            type = 1,
            reason = "Checkup"
        });
        created.EnsureSuccessStatusCode();

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(
            $"appointments/availability?from={day:o}&to={day.AddDays(1):o}");

        // Assert
        response.EnsureSuccessStatusCode();
        List<SlotDto>? slots = await response.Content.ReadFromJsonAsync<List<SlotDto>>();
        slots.ShouldNotBeNull();
        slots.ShouldNotBeEmpty();
        slots.ShouldAllBe(s => s.EndsAt - s.StartsAt == TimeSpan.FromMinutes(30));

        SlotDto bookedSlot = slots.Single(s => s.StartsAt == booked);
        bookedSlot.IsAvailable.ShouldBeFalse();
        bookedSlot.IsMine.ShouldBeTrue();
        slots.Single(s => s.StartsAt == booked.AddMinutes(30)).IsAvailable.ShouldBeTrue();
    }

    [Fact]
    public async Task GetAvailability_Should_RejectLongDuration_WhenCallerIsClient()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime day = NextTuesdayUtcMidnight();

        HttpResponseMessage response = await HttpClient.GetAsync(
            $"appointments/availability?from={day:o}&to={day.AddDays(1):o}&durationMinutes=90");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetPatients_Should_ReturnEmpty_WhenCallerIsAnUnlinkedClient()
    {
        // A fresh client account has no owner record, so the roster it can see is empty —
        // it must never fall through to the whole clinic's patients.
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage response = await HttpClient.GetAsync("patients");

        response.EnsureSuccessStatusCode();
        PatientsPage? page = await response.Content.ReadFromJsonAsync<PatientsPage>();
        page.ShouldNotBeNull();
        page.TotalCount.ShouldBe(0);
    }

    private sealed record PatientsPage(int TotalCount);
}
