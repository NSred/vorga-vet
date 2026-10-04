using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Appointments.Resolution;
using Domain.Appointments;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.CheckIn;

internal sealed class CheckInAppointmentCommandHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<CheckInAppointmentCommand, CheckInAppointmentResponse>
{
    public async Task<Result<CheckInAppointmentResponse>> Handle(
        CheckInAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        Appointment? appointment = await context.Appointments
            .SingleOrDefaultAsync(a => a.Id == command.AppointmentId, cancellationToken);

        if (appointment is null)
        {
            return Result.Failure<CheckInAppointmentResponse>(AppointmentErrors.NotFound(command.AppointmentId));
        }

        if (!AppointmentStatusTransitions.CanTransition(appointment.Status, AppointmentStatus.CheckedIn))
        {
            return Result.Failure<CheckInAppointmentResponse>(
                AppointmentErrors.InvalidTransition(appointment.Status, AppointmentStatus.CheckedIn));
        }

        DateTime now = dateTimeProvider.UtcNow;

        // Resolving the parties and flipping the status commit together: a checked-in
        // appointment always has a real owner and a real patient card behind it.
        Result<ResolvedParties> resolved = await AppointmentResolution.ResolveAsync(
            context, appointment, command.Owner, command.Patient, now, cancellationToken);

        if (resolved.IsFailure)
        {
            return Result.Failure<CheckInAppointmentResponse>(resolved.Error);
        }

        appointment.CheckIn(now);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(new CheckInAppointmentResponse(resolved.Value.OwnerId, resolved.Value.PatientId));
    }
}
