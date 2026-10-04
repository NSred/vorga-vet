using Application.Abstractions.Authentication;
using Application.Abstractions.Clinic;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Domain.Clinic;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.GetAvailability;

internal sealed class GetAvailabilityQueryHandler(
    IApplicationDbContext context,
    IUserContext userContext,
    IClinicSettings clinicSettings)
    : IQueryHandler<GetAvailabilityQuery, List<AvailabilitySlotResponse>>
{
    private const int SlotMinutes = 30;
    private static readonly TimeSpan MaxRange = TimeSpan.FromDays(62);

    public async Task<Result<List<AvailabilitySlotResponse>>> Handle(
        GetAvailabilityQuery query,
        CancellationToken cancellationToken)
    {
        var from = DateTime.SpecifyKind(query.From, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(query.To, DateTimeKind.Utc);

        if (to <= from)
        {
            return Result.Failure<List<AvailabilitySlotResponse>>(AppointmentErrors.InvalidRange);
        }

        if (to - from > MaxRange)
        {
            return Result.Failure<List<AvailabilitySlotResponse>>(AppointmentErrors.RangeTooWide);
        }

        int duration = query.DurationMinutes ?? SlotMinutes;

        if (duration <= 0 || duration % SlotMinutes != 0 ||
            duration != SlotMinutes && userContext.Role != Role.Veterinarian)
        {
            return Result.Failure<List<AvailabilitySlotResponse>>(AppointmentErrors.InvalidDuration);
        }

        Dictionary<DayOfWeek, ClinicSchedule> schedule = await context.ClinicSchedules
            .AsNoTracking()
            .ToDictionaryAsync(s => s.DayOfWeek, cancellationToken);

        // Everything active that could cover a slot in the window. Widened by the requested
        // duration so a multi-slot booking starting inside the window is checked to its end.
        DateTime loadTo = to.AddMinutes(duration);

        List<ActiveBooking> bookings = await context.Appointments
            .AsNoTracking()
            .Where(a => (a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.CheckedIn) &&
                        a.StartsAt < loadTo &&
                        a.EndsAt > from)
            .Select(a => new ActiveBooking(a.StartsAt, a.EndsAt, a.CreatedByUserId, a.OwnerId))
            .ToListAsync(cancellationToken);

        Guid userId = userContext.UserId;
        Guid? myOwnerId = null;

        if (userContext.Role == Role.Client)
        {
            myOwnerId = await context.Owners
                .Where(o => o.UserId == userId)
                .Select(o => (Guid?)o.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return GenerateSlots(from, to, duration, schedule, bookings, userId, myOwnerId);
    }

    private List<AvailabilitySlotResponse> GenerateSlots(
        DateTime from,
        DateTime to,
        int duration,
        Dictionary<DayOfWeek, ClinicSchedule> schedule,
        List<ActiveBooking> bookings,
        Guid userId,
        Guid? myOwnerId)
    {
        TimeZoneInfo timeZone = clinicSettings.TimeZone;

        // A calendar day is a clinic-local concept: walk local days, emit UTC instants.
        var firstDay = DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeFromUtc(from, timeZone).Date, DateTimeKind.Unspecified);
        var lastDay = DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeFromUtc(to, timeZone).Date, DateTimeKind.Unspecified);

        var slots = new List<AvailabilitySlotResponse>();

        for (DateTime day = firstDay; day <= lastDay; day = day.AddDays(1))
        {
            if (!schedule.TryGetValue(day.DayOfWeek, out ClinicSchedule? hours) || hours.IsClosed)
            {
                continue;
            }

            DateTime open = day.Add(hours.OpenTime.ToTimeSpan());
            DateTime close = day.Add(hours.CloseTime.ToTimeSpan());

            for (DateTime local = open; local.AddMinutes(SlotMinutes) <= close; local = local.AddMinutes(SlotMinutes))
            {
                if (timeZone.IsInvalidTime(local))
                {
                    continue; // the spring-forward gap; the clinic is not open then anyway
                }

                DateTime startUtc = TimeZoneInfo.ConvertTimeToUtc(local, timeZone);

                if (startUtc < from || startUtc >= to)
                {
                    continue;
                }

                DateTime slotEndUtc = startUtc.AddMinutes(SlotMinutes);
                DateTime requestedEndUtc = startUtc.AddMinutes(duration);

                // Available only if the whole requested span fits before closing and no active
                // booking covers any part of it — coverage, not "does something start here".
                bool fitsBeforeClose = local.AddMinutes(duration) <= close;
                bool isFree = fitsBeforeClose &&
                              !bookings.Any(b => b.StartsAt < requestedEndUtc && startUtc < b.EndsAt);

                bool isMine = bookings.Any(b =>
                    b.StartsAt < slotEndUtc && startUtc < b.EndsAt &&
                    (b.CreatedByUserId == userId || myOwnerId != null && b.OwnerId == myOwnerId));

                slots.Add(new AvailabilitySlotResponse
                {
                    StartsAt = startUtc,
                    EndsAt = slotEndUtc,
                    IsAvailable = isFree,
                    IsMine = isMine
                });
            }
        }

        return slots;
    }

    private sealed record ActiveBooking(DateTime StartsAt, DateTime EndsAt, Guid CreatedByUserId, Guid? OwnerId);
}
