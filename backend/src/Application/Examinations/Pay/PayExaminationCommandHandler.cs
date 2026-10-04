using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Examinations;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.Pay;

internal sealed class PayExaminationCommandHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<PayExaminationCommand>
{
    public async Task<Result> Handle(PayExaminationCommand command, CancellationToken cancellationToken)
    {
        Examination? examination = await context.Examinations
            .SingleOrDefaultAsync(e => e.Id == command.ExaminationId, cancellationToken);

        if (examination is null)
        {
            return Result.Failure(ExaminationErrors.NotFound(command.ExaminationId));
        }

        if (examination.IsPaid)
        {
            return Result.Failure(ExaminationErrors.AlreadyPaid);
        }

        examination.MarkPaid(dateTimeProvider.UtcNow);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
