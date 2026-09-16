using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Appointments.Resolution;
using Application.Examinations;
using Domain.Appointments;
using Domain.Examinations;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.Complete;

internal sealed class CompleteAppointmentCommandHandler(
    IApplicationDbContext context,
    IUserContext userContext,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<CompleteAppointmentCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CompleteAppointmentCommand command, CancellationToken cancellationToken)
    {
        Appointment? appointment = await context.Appointments
            .SingleOrDefaultAsync(a => a.Id == command.AppointmentId, cancellationToken);

        if (appointment is null)
        {
            return Result.Failure<Guid>(AppointmentErrors.NotFound(command.AppointmentId));
        }

        if (!AppointmentStatusTransitions.CanTransition(appointment.Status, AppointmentStatus.Completed))
        {
            return Result.Failure<Guid>(AppointmentErrors.InvalidTransition(appointment.Status, AppointmentStatus.Completed));
        }

        bool alreadyRecorded = await context.Examinations
            .AnyAsync(e => e.AppointmentId == appointment.Id, cancellationToken);

        if (alreadyRecorded)
        {
            return Result.Failure<Guid>(ExaminationErrors.AppointmentAlreadyHasExamination);
        }

        DateTime now = dateTimeProvider.UtcNow;

        // If check-in was skipped the booking may still be thin — resolve it here, same rule.
        Result<ResolvedParties> resolved = await AppointmentResolution.ResolveAsync(
            context, appointment, command.Owner, command.Patient, now, cancellationToken);

        if (resolved.IsFailure)
        {
            return Result.Failure<Guid>(resolved.Error);
        }

        ExaminationDetails details = command.Examination;

        var examination = Examination.Create(
            resolved.Value.PatientId,
            appointment.Id,
            details.PerformedByFirstName,
            details.PerformedByLastName,
            startedAtUtc: appointment.CheckedInAt ?? now,
            endedAtUtc: now,
            details.Anamnesis,
            details.Diagnosis,
            details.Therapy,
            details.Cost,
            now);

        context.Examinations.Add(examination);
        appointment.Complete(now, userContext.UserId);

        await context.SaveChangesAsync(cancellationToken);

        return examination.Id;
    }
}
