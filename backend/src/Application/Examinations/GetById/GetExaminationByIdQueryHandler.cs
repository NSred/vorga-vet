using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Examinations;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.GetById;

internal sealed class GetExaminationByIdQueryHandler(IApplicationDbContext context)
    : IQueryHandler<GetExaminationByIdQuery, ExaminationResponse>
{
    public async Task<Result<ExaminationResponse>> Handle(
        GetExaminationByIdQuery query,
        CancellationToken cancellationToken)
    {
        ExaminationResponse? examination = await context.Examinations
            .AsNoTracking()
            .Where(e => e.Id == query.ExaminationId)
            .Select(e => new ExaminationResponse
            {
                Id = e.Id,
                PatientId = e.PatientId,
                PatientName = context.Patients.Where(p => p.Id == e.PatientId).Select(p => p.Name).FirstOrDefault(),
                AppointmentId = e.AppointmentId,
                PerformedByFirstName = e.PerformedByFirstName,
                PerformedByLastName = e.PerformedByLastName,
                StartedAt = e.StartedAt,
                EndedAt = e.EndedAt,
                Anamnesis = e.Anamnesis,
                Diagnosis = e.Diagnosis,
                Therapy = e.Therapy,
                Cost = e.Cost,
                IsPaid = e.IsPaid,
                PaidAt = e.PaidAt,
                CreatedAt = e.CreatedAt
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (examination is null)
        {
            return Result.Failure<ExaminationResponse>(ExaminationErrors.NotFound(query.ExaminationId));
        }

        examination.Attachments = await context.Attachments
            .AsNoTracking()
            .Where(a => a.ExaminationId == query.ExaminationId)
            .OrderBy(a => a.UploadedAt)
            .Select(a => new AttachmentResponse
            {
                Id = a.Id,
                Kind = a.Kind,
                FileName = a.FileName,
                ContentType = a.ContentType,
                SizeBytes = a.SizeBytes,
                UploadedAt = a.UploadedAt
            })
            .ToListAsync(cancellationToken);

        return examination;
    }
}
