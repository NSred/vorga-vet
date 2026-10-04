using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SharedKernel;

namespace Application.Appointments.Reschedule;

internal sealed class RescheduleAppointmentCommandHandler(
    IApplicationDbContext context,
    IUserContext userContext)
    : ICommandHandler<RescheduleAppointmentCommand>
{
    public async Task<Result> Handle(RescheduleAppointmentCommand command, CancellationToken cancellationToken)
    {
        Appointment? appointment = await context.Appointments
            .SingleOrDefaultAsync(a => a.Id == command.AppointmentId, cancellationToken);

        if (appointment is null || !await IsVisibleToCallerAsync(appointment, cancellationToken))
        {
            return Result.Failure(AppointmentErrors.NotFound(command.AppointmentId));
        }

        if (appointment.Status != AppointmentStatus.Scheduled)
        {
            return Result.Failure(AppointmentErrors.OnlyScheduledCanBeRescheduled);
        }

        int duration = command.DurationMinutes ?? appointment.DurationMinutes;

        // The same time rules as booking: only a surgery may exceed one slot, and only a vet
        // may set a duration other than 30 at all.
        if (appointment.Type != AppointmentType.Surgery && duration != 30 ||
            duration != 30 && userContext.Role != Role.Veterinarian)
        {
            return Result.Failure(AppointmentErrors.InvalidDuration);
        }

        var startsAtUtc = DateTime.SpecifyKind(command.StartsAt, DateTimeKind.Utc);
        DateTime endsAtUtc = startsAtUtc.AddMinutes(duration);

        bool overlaps = await context.Appointments.AnyAsync(
            a => a.Id != appointment.Id &&
                 (a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.CheckedIn) &&
                 a.StartsAt < endsAtUtc &&
                 startsAtUtc < a.EndsAt,
            cancellationToken);

        if (overlaps)
        {
            return Result.Failure(AppointmentErrors.SlotTaken);
        }

        appointment.Reschedule(startsAtUtc, duration);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsExclusionViolation(ex))
        {
            return Result.Failure(AppointmentErrors.SlotTaken);
        }

        return Result.Success();
    }

    private async Task<bool> IsVisibleToCallerAsync(Appointment appointment, CancellationToken cancellationToken)
    {
        if (userContext.Role != Role.Client)
        {
            return true;
        }

        Guid userId = userContext.UserId;

        if (appointment.CreatedByUserId == userId)
        {
            return true;
        }

        return appointment.OwnerId is { } ownerId &&
               await context.Owners.AnyAsync(o => o.Id == ownerId && o.UserId == userId, cancellationToken);
    }

    private static bool IsExclusionViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.ExclusionViolation };
}
