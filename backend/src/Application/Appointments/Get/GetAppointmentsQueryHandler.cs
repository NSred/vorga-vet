using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.Get;

internal sealed class GetAppointmentsQueryHandler(IApplicationDbContext context, IUserContext userContext)
    : IQueryHandler<GetAppointmentsQuery, List<AppointmentResponse>>
{
    private static readonly TimeSpan MaxRange = TimeSpan.FromDays(62);

    public async Task<Result<List<AppointmentResponse>>> Handle(
        GetAppointmentsQuery query,
        CancellationToken cancellationToken)
    {
        var from = DateTime.SpecifyKind(query.From, DateTimeKind.Utc);
        var to = DateTime.SpecifyKind(query.To, DateTimeKind.Utc);

        if (to <= from)
        {
            return Result.Failure<List<AppointmentResponse>>(AppointmentErrors.InvalidRange);
        }

        if (to - from > MaxRange)
        {
            return Result.Failure<List<AppointmentResponse>>(AppointmentErrors.RangeTooWide);
        }

        // Appointments overlapping the visible window (a surgery straddling a boundary counts).
        IQueryable<Appointment> filtered = context.Appointments
            .AsNoTracking()
            .Where(a => a.StartsAt < to && a.EndsAt > from);

        if (userContext.Role == Role.Client)
        {
            Guid userId = userContext.UserId;

            Guid? myOwnerId = await context.Owners
                .Where(o => o.UserId == userId)
                .Select(o => (Guid?)o.Id)
                .FirstOrDefaultAsync(cancellationToken);

            filtered = filtered.Where(a =>
                a.CreatedByUserId == userId ||
                myOwnerId != null && a.OwnerId == myOwnerId);
        }

        List<AppointmentResponse> items = await filtered
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
