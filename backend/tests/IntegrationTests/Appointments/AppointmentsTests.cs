using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Appointments;

public sealed class AppointmentsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private static DateTime NextMondayNineUtc()
    {
        DateTime date = DateTime.UtcNow.Date.AddDays(14);
        while (date.DayOfWeek != DayOfWeek.Monday)
        {
            date = date.AddDays(1);
        }

        return new DateTime(date.Year, date.Month, date.Day, 9, 0, 0, DateTimeKind.Utc);
    }

    private static object CreateRequest(DateTime startsAt, int type = 1, int durationMinutes = 30) => new
    {
        startsAt,
        durationMinutes,
        type,
        reason = "Routine"
    };

    [Fact]
    public async Task CreateAppointment_Should_ReturnUnauthorized_WhenTokenMissing()
    {
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("appointments", CreateRequest(NextMondayNineUtc()));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateAppointment_Should_Succeed_WhenVetBooksValidSlot()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("appointments", CreateRequest(NextMondayNineUtc()));

        response.EnsureSuccessStatusCode();
        Guid id = await response.Content.ReadFromJsonAsync<Guid>();
        id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreateAppointment_Should_ReturnConflict_WhenSlotAlreadyBooked()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime slot = NextMondayNineUtc().AddDays(1);

        HttpResponseMessage first = await HttpClient.PostAsJsonAsync("appointments", CreateRequest(slot));
        first.EnsureSuccessStatusCode();

        HttpResponseMessage second = await HttpClient.PostAsJsonAsync("appointments", CreateRequest(slot));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateAppointment_Should_ReturnConflict_WhenA30MinSlotIsCoveredByASurgery()
    {
        // The one that proves the range-exclusion constraint, not a start-time uniqueness check:
        // a 90-minute surgery at 09:00 must block a 30-minute booking at 09:30.
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime start = NextMondayNineUtc().AddDays(2);

        HttpResponseMessage surgery = await HttpClient.PostAsJsonAsync(
            "appointments", CreateRequest(start, type: 3, durationMinutes: 90));
        surgery.EnsureSuccessStatusCode();

        HttpResponseMessage covered = await HttpClient.PostAsJsonAsync(
            "appointments", CreateRequest(start.AddMinutes(30)));

        covered.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateAppointment_Should_Fail_WhenClientRequestsSurgery()
    {
        (_, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage response = await HttpClient.PostAsJsonAsync(
            "appointments", CreateRequest(NextMondayNineUtc().AddDays(3), type: 3, durationMinutes: 60));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAppointments_Should_ReturnBookingsInRange()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime slot = NextMondayNineUtc().AddDays(4);

        HttpResponseMessage created = await HttpClient.PostAsJsonAsync("appointments", CreateRequest(slot));
        created.EnsureSuccessStatusCode();
        Guid id = await created.Content.ReadFromJsonAsync<Guid>();

        string from = slot.Date.ToString("o");
        string to = slot.Date.AddDays(1).ToString("o");
        HttpResponseMessage response = await HttpClient.GetAsync($"appointments?from={from}&to={to}");

        response.EnsureSuccessStatusCode();
        List<AppointmentDto>? items = await response.Content.ReadFromJsonAsync<List<AppointmentDto>>();
        items.ShouldNotBeNull();
        items.ShouldContain(a => a.Id == id);
    }

    [Fact]
    public async Task GetAppointmentById_Should_Return404_WhenMissing()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);

        HttpResponseMessage response = await HttpClient.GetAsync($"appointments/{Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetAppointmentById_Should_ReturnAppointment_WhenExists()
    {
        (_, AccessTokens tokens) = await RegisterVeterinarianAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTime slot = NextMondayNineUtc().AddDays(5);

        HttpResponseMessage created = await HttpClient.PostAsJsonAsync("appointments", CreateRequest(slot));
        created.EnsureSuccessStatusCode();
        Guid id = await created.Content.ReadFromJsonAsync<Guid>();

        HttpResponseMessage response = await HttpClient.GetAsync($"appointments/{id}");

        response.EnsureSuccessStatusCode();
        AppointmentDto? dto = await response.Content.ReadFromJsonAsync<AppointmentDto>();
        dto.ShouldNotBeNull();
        dto.Id.ShouldBe(id);
    }

    private sealed record AppointmentDto(Guid Id, DateTime StartsAt, DateTime EndsAt, int DurationMinutes, int Type, int Status);
}
