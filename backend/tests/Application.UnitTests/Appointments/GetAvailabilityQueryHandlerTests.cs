using Application.Abstractions.Authentication;
using Application.Abstractions.Clinic;
using Application.Appointments.GetAvailability;
using Application.UnitTests.Abstractions;
using Domain.Appointments;
using Domain.Clinic;
using Domain.Users;
using SharedKernel;

namespace Application.UnitTests.Appointments;

public sealed class GetAvailabilityQueryHandlerTests : BaseHandlerTest
{
    // Wednesday 10 Sep 2026. The clinic runs in UTC for these tests so local == UTC and
    // the slot arithmetic is easy to read; the timezone conversion itself is exercised
    // by the integration tests against the real Europe/Belgrade setting.
    private static readonly DateTime DayStartUtc = new(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc);

    private static GetAvailabilityQueryHandler CreateHandler(TestDbContext context, Role role, Guid userId)
    {
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.Role.Returns(role);
        userContext.UserId.Returns(userId);

        IClinicSettings settings = Substitute.For<IClinicSettings>();
        settings.TimeZone.Returns(TimeZoneInfo.Utc);

        return new GetAvailabilityQueryHandler(context, userContext, settings);
    }

    private static async Task SeedOpenNineToTwelveAsync(TestDbContext context)
    {
        // Open 09:00-12:00 every day: six 30-minute slots per day.
        foreach (DayOfWeek day in Enum.GetValues<DayOfWeek>())
        {
            context.ClinicSchedules.Add(ClinicSchedule.Create(day, new TimeOnly(9, 0), new TimeOnly(12, 0), isClosed: false));
        }

        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task Handle_Should_GenerateSlotsFromScheduleAndMarkCoveredOnesTaken()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOpenNineToTwelveAsync(context);

        // A 60-minute surgery at 10:00 covers the 10:00 and 10:30 slots.
        context.Appointments.Add(Appointment.Create(
            Guid.NewGuid(), null, null, DayStartUtc.AddHours(10), 60, AppointmentType.Surgery, null, DateTime.UtcNow));
        await context.SaveChangesAsync();

        GetAvailabilityQueryHandler handler = CreateHandler(context, Role.Veterinarian, Guid.NewGuid());
        var query = new GetAvailabilityQuery(DayStartUtc, DayStartUtc.AddDays(1), null);

        // Act
        Result<List<AvailabilitySlotResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        List<AvailabilitySlotResponse> slots = result.Value;
        slots.Count.ShouldBe(6);
        slots.Select(s => s.StartsAt.Hour * 60 + s.StartsAt.Minute)
            .ShouldBe([540, 570, 600, 630, 660, 690]);

        slots.Single(s => s.StartsAt == DayStartUtc.AddHours(10)).IsAvailable.ShouldBeFalse();
        slots.Single(s => s.StartsAt == DayStartUtc.AddHours(10).AddMinutes(30)).IsAvailable.ShouldBeFalse();
        slots.Single(s => s.StartsAt == DayStartUtc.AddHours(9)).IsAvailable.ShouldBeTrue();
        slots.Single(s => s.StartsAt == DayStartUtc.AddHours(11)).IsAvailable.ShouldBeTrue();
    }

    [Fact]
    public async Task Handle_Should_RequireConsecutiveRoomAndFitBeforeClose_WhenDurationRequested()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOpenNineToTwelveAsync(context);

        // 30 minutes booked at 10:00 splits the morning.
        context.Appointments.Add(Appointment.Create(
            Guid.NewGuid(), null, null, DayStartUtc.AddHours(10), 30, AppointmentType.Checkup, null, DateTime.UtcNow));
        await context.SaveChangesAsync();

        GetAvailabilityQueryHandler handler = CreateHandler(context, Role.Veterinarian, Guid.NewGuid());
        var query = new GetAvailabilityQuery(DayStartUtc, DayStartUtc.AddDays(1), 90);

        // Act
        Result<List<AvailabilitySlotResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert — a 90-minute surgery only fits where three consecutive free slots remain
        // before the 12:00 close: 10:30 (10:30-12:00). 09:00 runs into the 10:00 booking,
        // 11:00 and 11:30 run past closing.
        List<AvailabilitySlotResponse> slots = result.Value;
        slots.Where(s => s.IsAvailable).Select(s => s.StartsAt)
            .ShouldBe([DayStartUtc.AddHours(10).AddMinutes(30)]);
    }

    [Fact]
    public async Task Handle_Should_RejectDurationOver30_WhenCallerIsClient()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOpenNineToTwelveAsync(context);
        GetAvailabilityQueryHandler handler = CreateHandler(context, Role.Client, Guid.NewGuid());

        // Act
        Result<List<AvailabilitySlotResponse>> result =
            await handler.Handle(new GetAvailabilityQuery(DayStartUtc, DayStartUtc.AddDays(1), 60), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.InvalidDuration);
    }

    [Fact]
    public async Task Handle_Should_FlagOnlyTheCallersOwnBookingAsMine()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOpenNineToTwelveAsync(context);
        var me = Guid.NewGuid();

        context.Appointments.Add(Appointment.Create(
            me, null, null, DayStartUtc.AddHours(9), 30, AppointmentType.Checkup, null, DateTime.UtcNow));
        context.Appointments.Add(Appointment.Create(
            Guid.NewGuid(), null, null, DayStartUtc.AddHours(11), 30, AppointmentType.Checkup, null, DateTime.UtcNow));
        await context.SaveChangesAsync();

        GetAvailabilityQueryHandler handler = CreateHandler(context, Role.Client, me);

        // Act
        Result<List<AvailabilitySlotResponse>> result =
            await handler.Handle(new GetAvailabilityQuery(DayStartUtc, DayStartUtc.AddDays(1), null), CancellationToken.None);

        // Assert — both slots read as taken, but only mine is flagged as mine.
        List<AvailabilitySlotResponse> slots = result.Value;
        slots.Single(s => s.StartsAt == DayStartUtc.AddHours(9)).IsMine.ShouldBeTrue();
        slots.Single(s => s.StartsAt == DayStartUtc.AddHours(11)).IsMine.ShouldBeFalse();
        slots.Single(s => s.StartsAt == DayStartUtc.AddHours(11)).IsAvailable.ShouldBeFalse();
    }
}
