using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Patients.Create;

internal sealed class CreatePatientCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTimeProvider)
    : ICommandHandler<CreatePatientCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreatePatientCommand command, CancellationToken cancellationToken)
    {
        bool cardNumberTaken = await context.Patients
            .AnyAsync(p => p.CardNumber == command.CardNumber, cancellationToken);

        if (cardNumberTaken)
        {
            return Result.Failure<Guid>(PatientErrors.CardNumberNotUnique);
        }

        bool ownerExists = await context.Owners.AnyAsync(o => o.Id == command.OwnerId, cancellationToken);

        if (!ownerExists)
        {
            return Result.Failure<Guid>(OwnerErrors.NotFound(command.OwnerId));
        }

        bool breedExists = await context.Breeds.AnyAsync(b => b.Id == command.BreedId, cancellationToken);

        if (!breedExists)
        {
            return Result.Failure<Guid>(BreedErrors.NotFound(command.BreedId));
        }

        var distinctAllergenIds = command.AllergenIds.Distinct().ToList();

        if (distinctAllergenIds.Count > 0)
        {
            List<Guid> foundAllergenIds = await context.Allergens
                .Where(a => distinctAllergenIds.Contains(a.Id))
                .Select(a => a.Id)
                .ToListAsync(cancellationToken);

            if (foundAllergenIds.Count != distinctAllergenIds.Count)
            {
                Guid missingAllergenId = distinctAllergenIds.Except(foundAllergenIds).First();

                return Result.Failure<Guid>(AllergenErrors.NotFound(missingAllergenId));
            }
        }

        var patient = Patient.Create(
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
            command.Note,
            dateTimeProvider.UtcNow);

        context.Patients.Add(patient);

        foreach (Guid allergenId in distinctAllergenIds)
        {
            context.PatientAllergens.Add(PatientAllergen.Create(patient.Id, allergenId));
        }

        await context.SaveChangesAsync(cancellationToken);

        return patient.Id;
    }
}
