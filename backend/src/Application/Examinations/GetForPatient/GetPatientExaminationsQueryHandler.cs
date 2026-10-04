using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Examinations.GetForPatient;

internal sealed class GetPatientExaminationsQueryHandler(IApplicationDbContext context)
    : IQueryHandler<GetPatientExaminationsQuery, List<ExaminationResponse>>
{
    public async Task<Result<List<ExaminationResponse>>> Handle(
        GetPatientExaminationsQuery query,
        CancellationToken cancellationToken)
    {
        string? patientName = await context.Patients
            .Where(p => p.Id == query.PatientId)
            .Select(p => p.Name)
            .FirstOrDefaultAsync(cancellationToken);

        if (patientName is null)
        {
            return Result.Failure<List<ExaminationResponse>>(PatientErrors.NotFound(query.PatientId));
        }

        List<ExaminationResponse> items = await context.Examinations
            .AsNoTracking()
            .Where(e => e.PatientId == query.PatientId)
            .OrderByDescending(e => e.StartedAt)
            .Select(e => new ExaminationResponse
            {
                Id = e.Id,
                PatientId = e.PatientId,
                PatientName = patientName,
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
            .ToListAsync(cancellationToken);

        // One query for every image on the timeline, then fan out by examination.
        List<(Guid ExaminationId, AttachmentResponse Attachment)> attachments = await context.Attachments
            .AsNoTracking()
            .Where(a => a.PatientId == query.PatientId)
            .OrderBy(a => a.UploadedAt)
            .Select(a => new ValueTuple<Guid, AttachmentResponse>(a.ExaminationId, new AttachmentResponse
            {
                Id = a.Id,
                Kind = a.Kind,
                FileName = a.FileName,
                ContentType = a.ContentType,
                SizeBytes = a.SizeBytes,
                UploadedAt = a.UploadedAt
            }))
            .ToListAsync(cancellationToken);

        ILookup<Guid, AttachmentResponse> byExamination = attachments.ToLookup(x => x.ExaminationId, x => x.Attachment);

        foreach (ExaminationResponse item in items)
        {
            item.Attachments = [.. byExamination[item.Id]];
        }

        return items;
    }
}
