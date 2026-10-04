using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.GetUnresolved;

internal sealed class GetUnresolvedAppointmentsQueryHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider)
    : IQueryHandler<GetUnresolvedAppointmentsQuery, List<AppointmentResponse>>
{
    public async Task<Result<List<AppointmentResponse>>> Handle(
        GetUnresolvedAppointmentsQuery query,
        CancellationToken cancellationToken)
    {
        DateTime now = dateTimeProvider.UtcNow;

        List<AppointmentResponse> items = await context.Appointments
            .AsNoTracking()
            .Where(a => a.Status == AppointmentStatus.Scheduled && a.StartsAt < now)
            .OrderBy(a => a.StartsAt)
            .Select(a => new AppointmentResponse
            {
                Id = a.Id,
                CreatedByUserId = a.CreatedByUserId,
                OwnerId = a.OwnerId,
                PatientId = a.PatientId,
                StartsAt = a.StartsAt,
                EndsAt = a.EndsAt,
                DurationMinutes = a.DurationMinutes,
                Type = a.Type,
                Status = a.Status,
                Reason = a.Reason,
                OwnerName = context.Owners
                    .Where(o => o.Id == a.OwnerId)
                    .Select(o => o.FirstName + " " + o.LastName)
                    .FirstOrDefault(),
                PatientName = context.Patients
                    .Where(p => p.Id == a.PatientId)
                    .Select(p => p.Name)
                    .FirstOrDefault(),
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return items;
    }
}
