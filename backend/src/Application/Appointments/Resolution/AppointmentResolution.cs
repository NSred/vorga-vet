using Application.Abstractions.Data;
using Domain.Appointments;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Appointments.Resolution;

/// <summary>
/// The one place a thin booking becomes real clinic records. Check-in and complete both call
/// it, so the "resolve owner, then patient under that owner" rule exists once. It only adds
/// entities to the context — the calling handler owns the transaction.
/// </summary>
internal static class AppointmentResolution
{
    public static async Task<Result<ResolvedParties>> ResolveAsync(
        IApplicationDbContext context,
        Appointment appointment,
        OwnerResolution? owner,
        PatientResolution? patient,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        Result<Guid> ownerResult = await ResolveOwnerAsync(context, appointment, owner, cancellationToken);
        if (ownerResult.IsFailure)
        {
            return Result.Failure<ResolvedParties>(ownerResult.Error);
        }

        Result<Guid> patientResult = await ResolvePatientAsync(
            context, appointment, patient, ownerResult.Value, utcNow, cancellationToken);
        if (patientResult.IsFailure)
        {
            return Result.Failure<ResolvedParties>(patientResult.Error);
        }

        return Result.Success(new ResolvedParties(ownerResult.Value, patientResult.Value));
    }

    private static async Task<Result<Guid>> ResolveOwnerAsync(
        IApplicationDbContext context,
        Appointment appointment,
        OwnerResolution? owner,
        CancellationToken cancellationToken)
    {
        if (appointment.OwnerId is { } alreadyKnown)
        {
            return Result.Success(alreadyKnown);
        }

        if (owner is null || owner.ExistingOwnerId is null && owner.Create is null)
        {
            return Result.Failure<Guid>(AppointmentErrors.OwnerResolutionRequired);
        }

        if (owner.ExistingOwnerId is not null && owner.Create is not null)
        {
            return Result.Failure<Guid>(AppointmentErrors.AmbiguousResolution);
        }

        Guid ownerId;

        if (owner.ExistingOwnerId is { } existingId)
        {
            bool exists = await context.Owners.AnyAsync(o => o.Id == existingId, cancellationToken);
            if (!exists)
            {
                return Result.Failure<Guid>(OwnerErrors.NotFound(existingId));
            }

            ownerId = existingId;
        }
        else
        {
            NewOwnerDetails details = owner.Create!;
            string? email = Owner.NormalizeEmail(details.Email);

            if (email is not null && await context.Owners.AnyAsync(o => o.Email == email, cancellationToken))
            {
                return Result.Failure<Guid>(OwnerErrors.EmailNotUnique);
            }

            var created = Owner.Create(
                details.FirstName, details.LastName, details.PhoneNumber, details.Address, details.City, details.Email);
            context.Owners.Add(created);
            ownerId = created.Id;
        }

        appointment.AttachOwner(ownerId);

        return Result.Success(ownerId);
    }

    private static async Task<Result<Guid>> ResolvePatientAsync(
        IApplicationDbContext context,
        Appointment appointment,
        PatientResolution? patient,
        Guid ownerId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        if (appointment.PatientId is { } alreadyKnown)
        {
            return Result.Success(alreadyKnown);
        }

        if (patient is null || patient.ExistingPatientId is null && patient.Create is null)
        {
            return Result.Failure<Guid>(AppointmentErrors.PatientResolutionRequired);
        }

        if (patient.ExistingPatientId is not null && patient.Create is not null)
        {
            return Result.Failure<Guid>(AppointmentErrors.AmbiguousResolution);
        }

        Guid patientId;

        if (patient.ExistingPatientId is { } existingId)
        {
            Guid? patientOwnerId = await context.Patients
                .Where(p => p.Id == existingId && !p.IsDeleted)
                .Select(p => (Guid?)p.OwnerId)
                .FirstOrDefaultAsync(cancellationToken);

            if (patientOwnerId is null)
            {
                return Result.Failure<Guid>(PatientErrors.NotFound(existingId));
            }

            if (patientOwnerId != ownerId)
            {
                return Result.Failure<Guid>(AppointmentErrors.PatientDoesNotBelongToOwner);
            }

            patientId = existingId;
        }
        else
        {
            NewPatientDetails details = patient.Create!;

            bool breedExists = await context.Breeds.AnyAsync(b => b.Id == details.BreedId, cancellationToken);
            if (!breedExists)
            {
                return Result.Failure<Guid>(BreedErrors.NotFound(details.BreedId));
            }

            bool cardTaken = await context.Patients.AnyAsync(p => p.CardNumber == details.CardNumber, cancellationToken);
            if (cardTaken)
            {
                return Result.Failure<Guid>(PatientErrors.CardNumberNotUnique);
            }

            var created = Patient.Create(
                ownerId,
                details.BreedId,
                details.CardNumber,
                details.Name,
                details.Sex,
                details.BirthDate,
                weightKg: null,
                details.Color,
                details.ChipNumber,
                anamnesis: null,
                details.Note,
                utcNow);
            context.Patients.Add(created);
            patientId = created.Id;
        }

        appointment.AttachPatient(patientId);

        return Result.Success(patientId);
    }
}
