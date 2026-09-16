using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Appointments;
using Domain.Owners;
using Domain.Patients;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SharedKernel;

namespace Application.Appointments.Create;

internal sealed class CreateAppointmentCommandHandler(
    IApplicationDbContext context,
    IUserContext userContext,
    IDateTimeProvider dateTimeProvider)
    : ICommandHandler<CreateAppointmentCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateAppointmentCommand command, CancellationToken cancellationToken)
    {
        Role role = userContext.Role;
        Guid userId = userContext.UserId;

        // Only a vet may book a surgery; every other type is a single 30-minute slot.
        if (command.Type == AppointmentType.Surgery && role != Role.Veterinarian)
        {
            return Result.Failure<Guid>(AppointmentErrors.SurgeryRequiresVeterinarian);
        }

        if (command.Type != AppointmentType.Surgery && command.DurationMinutes != 30)
        {
            return Result.Failure<Guid>(AppointmentErrors.InvalidDuration);
        }

        Result<Guid?> ownerResult = await ResolveOwnerAsync(command, role, userId, cancellationToken);
        if (ownerResult.IsFailure)
        {
            return Result.Failure<Guid>(ownerResult.Error);
        }

        Guid? ownerId = ownerResult.Value;

        Result<Guid?> patientResult = await ResolvePatientAsync(command, role, ownerId, cancellationToken);
        if (patientResult.IsFailure)
        {
            return Result.Failure<Guid>(patientResult.Error);
        }

        // A vet booking against a patient with no explicit owner inherits the patient's owner.
        if (ownerId is null && command.PatientId is not null && patientResult.Value is not null)
        {
            ownerId = patientResult.Value;
        }

        var startsAtUtc = DateTime.SpecifyKind(command.StartsAt, DateTimeKind.Utc);
        DateTime endsAtUtc = startsAtUtc.AddMinutes(command.DurationMinutes);

        // Cheap pre-check for the friendly message in the common case; the database
        // exclusion constraint is the correctness guarantee when two bookings race.
        bool overlaps = await context.Appointments.AnyAsync(
            a => (a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.CheckedIn) &&
                 a.StartsAt < endsAtUtc &&
                 startsAtUtc < a.EndsAt,
            cancellationToken);

        if (overlaps)
        {
            return Result.Failure<Guid>(AppointmentErrors.SlotTaken);
        }

        var appointment = Appointment.Create(
            userId,
            ownerId,
            command.PatientId,
            startsAtUtc,
            command.DurationMinutes,
            command.Type,
            command.Reason,
            dateTimeProvider.UtcNow);

        context.Appointments.Add(appointment);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsExclusionViolation(ex))
        {
            return Result.Failure<Guid>(AppointmentErrors.SlotTaken);
        }

        return appointment.Id;
    }

    private async Task<Result<Guid?>> ResolveOwnerAsync(
        CreateAppointmentCommand command, Role role, Guid userId, CancellationToken cancellationToken)
    {
        if (role == Role.Client)
        {
            // A client books only for itself; the owner is their linked record, or null when unlinked.
            Guid? linkedOwnerId = await context.Owners
                .Where(o => o.UserId == userId)
                .Select(o => (Guid?)o.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return Result.Success(linkedOwnerId);
        }

        if (command.OwnerId is { } ownerId)
        {
            bool ownerExists = await context.Owners.AnyAsync(o => o.Id == ownerId, cancellationToken);

            if (!ownerExists)
            {
                return Result.Failure<Guid?>(OwnerErrors.NotFound(ownerId));
            }
        }

        // Explicit Success — the implicit T -> Result<T> conversion treats a null value as a failure.
        return Result.Success(command.OwnerId);
    }

    private async Task<Result<Guid?>> ResolvePatientAsync(
        CreateAppointmentCommand command, Role role, Guid? ownerId, CancellationToken cancellationToken)
    {
        if (command.PatientId is not { } patientId)
        {
            return Result.Success<Guid?>(null);
        }

        Guid? patientOwnerId = await context.Patients
            .Where(p => p.Id == patientId && !p.IsDeleted)
            .Select(p => (Guid?)p.OwnerId)
            .FirstOrDefaultAsync(cancellationToken);

        if (patientOwnerId is null)
        {
            return Result.Failure<Guid?>(PatientErrors.NotFound(patientId));
        }

        // A client may only book for their own animals; a vet with an explicit owner must match.
        if (role == Role.Client)
        {
            if (ownerId is null || patientOwnerId != ownerId)
            {
                return Result.Failure<Guid?>(AppointmentErrors.PatientDoesNotBelongToOwner);
            }
        }
        else if (ownerId is not null && patientOwnerId != ownerId)
        {
            return Result.Failure<Guid?>(AppointmentErrors.PatientDoesNotBelongToOwner);
        }

        return Result.Success(patientOwnerId);
    }

    private static bool IsExclusionViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.ExclusionViolation };
}
