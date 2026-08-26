using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Patients.Delete;

internal sealed class DeletePatientCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTimeProvider)
    : ICommandHandler<DeletePatientCommand>
{
    public async Task<Result> Handle(DeletePatientCommand command, CancellationToken cancellationToken)
    {
        Patient? patient = await context.Patients
            .SingleOrDefaultAsync(p => p.Id == command.PatientId, cancellationToken);

        if (patient is null)
        {
            return Result.Failure(PatientErrors.NotFound(command.PatientId));
        }

        if (patient.IsDeleted)
        {
            return Result.Failure(PatientErrors.AlreadyDeleted(command.PatientId));
        }

        patient.MarkDeleted(dateTimeProvider.UtcNow);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
