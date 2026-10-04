using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Patients.Update;

internal sealed class UpdatePatientCommandHandler(IApplicationDbContext context)
    : ICommandHandler<UpdatePatientCommand>
{
    public async Task<Result> Handle(UpdatePatientCommand command, CancellationToken cancellationToken)
    {
        Patient? patient = await context.Patients
            .SingleOrDefaultAsync(p => p.Id == command.PatientId, cancellationToken);

        if (patient is null)
        {
            return Result.Failure(PatientErrors.NotFound(command.PatientId));
        }

        var distinctAllergenIds = command.AllergenIds.Distinct().ToList();

        Error? validationError = await ValidateReferencesAsync(command, distinctAllergenIds, cancellationToken);

        if (validationError is not null)
        {
            return Result.Failure(validationError);
        }

        patient.UpdateDetails(
            command.OwnerId,
            command.BreedId,
            command.CardNumber,
            command.Name,
            command.Sex,
            command.BirthDate,
            command.WeightKg,
            command.Color,
            command.ChipNumber,
            command.Anamnesis,
            command.Note);

        await SyncAllergenLinksAsync(patient.Id, distinctAllergenIds, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private async Task<Error?> ValidateReferencesAsync(
        UpdatePatientCommand command, List<Guid> distinctAllergenIds, CancellationToken cancellationToken)
    {
        bool cardNumberTaken = await context.Patients
            .AnyAsync(p => p.CardNumber == command.CardNumber && p.Id != command.PatientId, cancellationToken);

        if (cardNumberTaken)
        {
            return PatientErrors.CardNumberNotUnique;
        }

        bool ownerExists = await context.Owners.AnyAsync(o => o.Id == command.OwnerId, cancellationToken);

        if (!ownerExists)
        {
            return OwnerErrors.NotFound(command.OwnerId);
        }

        bool breedExists = await context.Breeds.AnyAsync(b => b.Id == command.BreedId, cancellationToken);

        if (!breedExists)
        {
            return BreedErrors.NotFound(command.BreedId);
        }

        if (distinctAllergenIds.Count == 0)
        {
            return null;
        }

        List<Guid> foundAllergenIds = await context.Allergens
            .Where(a => distinctAllergenIds.Contains(a.Id))
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        return foundAllergenIds.Count != distinctAllergenIds.Count
                ? AllergenErrors.NotFound(distinctAllergenIds.Except(foundAllergenIds).First()) 
                : null;
    }

    private async Task SyncAllergenLinksAsync(Guid patientId, List<Guid> desiredAllergenIds, CancellationToken cancellationToken)
    {
        List<PatientAllergen> existingLinks = await context.PatientAllergens
            .Where(pa => pa.PatientId == patientId)
            .ToListAsync(cancellationToken);

        foreach (PatientAllergen link in existingLinks.Where(l => !desiredAllergenIds.Contains(l.AllergenId)))
        {
            context.PatientAllergens.Remove(link);
        }

        var existingAllergenIds = existingLinks.Select(l => l.AllergenId).ToList();

        foreach (Guid allergenId in desiredAllergenIds.Except(existingAllergenIds))
        {
            context.PatientAllergens.Add(PatientAllergen.Create(patientId, allergenId));
        }
    }
}
