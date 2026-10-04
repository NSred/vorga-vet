using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.MarkNoShow;

internal sealed class MarkNoShowCommandHandler(
    IApplicationDbContext context,
    IUserContext userContext,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<MarkNoShowCommand>
{
    public async Task<Result> Handle(MarkNoShowCommand command, CancellationToken cancellationToken)
    {
        Appointment? appointment = await context.Appointments
            .SingleOrDefaultAsync(a => a.Id == command.AppointmentId, cancellationToken);

        if (appointment is null)
        {
            return Result.Failure(AppointmentErrors.NotFound(command.AppointmentId));
        }

        if (!AppointmentStatusTransitions.CanTransition(appointment.Status, AppointmentStatus.NoShow))
        {
            return Result.Failure(AppointmentErrors.InvalidTransition(appointment.Status, AppointmentStatus.NoShow));
        }

        // A person decides this, never a job — ClosedByUserId records who.
        appointment.MarkNoShow(dateTimeProvider.UtcNow, userContext.UserId, command.Note);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
