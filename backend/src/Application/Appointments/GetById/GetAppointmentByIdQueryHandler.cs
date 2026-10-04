using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.GetById;

internal sealed class GetAppointmentByIdQueryHandler(IApplicationDbContext context, IUserContext userContext)
    : IQueryHandler<GetAppointmentByIdQuery, AppointmentResponse>
{
    public async Task<Result<AppointmentResponse>> Handle(
        GetAppointmentByIdQuery query,
        CancellationToken cancellationToken)
    {
        IQueryable<Appointment> scoped = context.Appointments
            .AsNoTracking()
            .Where(a => a.Id == query.AppointmentId);

        // A client only sees its own; anyone else's id returns NotFound rather than Forbidden,
        // so appointment ids stay unprobeable.
        if (userContext.Role == Role.Client)
        {
            Guid userId = userContext.UserId;

            Guid? myOwnerId = await context.Owners
                .Where(o => o.UserId == userId)
                .Select(o => (Guid?)o.Id)
                .FirstOrDefaultAsync(cancellationToken);

            scoped = scoped.Where(a =>
                a.CreatedByUserId == userId ||
                myOwnerId != null && a.OwnerId == myOwnerId);
        }

        AppointmentResponse? appointment = await scoped
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
            .SingleOrDefaultAsync(cancellationToken);

        if (appointment is null)
        {
            return Result.Failure<AppointmentResponse>(AppointmentErrors.NotFound(query.AppointmentId));
        }

        return appointment;
    }
}
