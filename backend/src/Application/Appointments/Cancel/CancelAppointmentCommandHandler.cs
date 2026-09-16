using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.Cancel;

internal sealed class CancelAppointmentCommandHandler(
    IApplicationDbContext context,
    IUserContext userContext,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<CancelAppointmentCommand>
{
    public async Task<Result> Handle(CancelAppointmentCommand command, CancellationToken cancellationToken)
    {
        Appointment? appointment = await context.Appointments
            .SingleOrDefaultAsync(a => a.Id == command.AppointmentId, cancellationToken);

        // A client may only cancel their own; anyone else's reads as NotFound, not Forbidden.
        if (appointment is null || !await IsVisibleToCallerAsync(appointment, cancellationToken))
        {
            return Result.Failure(AppointmentErrors.NotFound(command.AppointmentId));
        }

        if (!AppointmentStatusTransitions.CanTransition(appointment.Status, AppointmentStatus.Cancelled))
        {
            return Result.Failure(AppointmentErrors.InvalidTransition(appointment.Status, AppointmentStatus.Cancelled));
        }

        appointment.Cancel(dateTimeProvider.UtcNow, userContext.UserId, command.Reason);

        await context.SaveChangesAsync(cancellationToken);

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
}
