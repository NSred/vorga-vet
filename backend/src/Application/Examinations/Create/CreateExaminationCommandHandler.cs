using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Examinations;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.Create;

internal sealed class CreateExaminationCommandHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<CreateExaminationCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateExaminationCommand command, CancellationToken cancellationToken)
    {
        bool patientExists = await context.Patients
            .AnyAsync(p => p.Id == command.PatientId && !p.IsDeleted, cancellationToken);

        if (!patientExists)
        {
            return Result.Failure<Guid>(PatientErrors.NotFound(command.PatientId));
        }

        DateTime now = dateTimeProvider.UtcNow;
        ExaminationDetails details = command.Examination;

        var examination = Examination.Create(
            command.PatientId,
            appointmentId: null,
            details.PerformedByFirstName,
            details.PerformedByLastName,
            startedAtUtc: now,
            endedAtUtc: now,
            details.Anamnesis,
            details.Diagnosis,
            details.Therapy,
            details.Cost,
            now);

        context.Examinations.Add(examination);

        await context.SaveChangesAsync(cancellationToken);

        return examination.Id;
    }
}
