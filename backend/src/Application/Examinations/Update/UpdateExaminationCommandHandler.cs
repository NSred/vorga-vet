using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Examinations;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.Update;

internal sealed class UpdateExaminationCommandHandler(IApplicationDbContext context)
    : ICommandHandler<UpdateExaminationCommand>
{
    public async Task<Result> Handle(UpdateExaminationCommand command, CancellationToken cancellationToken)
    {
        Examination? examination = await context.Examinations
            .SingleOrDefaultAsync(e => e.Id == command.ExaminationId, cancellationToken);

        if (examination is null)
        {
            return Result.Failure(ExaminationErrors.NotFound(command.ExaminationId));
        }

        ExaminationDetails details = command.Examination;

        examination.UpdateDetails(
            details.PerformedByFirstName,
            details.PerformedByLastName,
            details.Anamnesis,
            details.Diagnosis,
            details.Therapy,
            details.Cost);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
