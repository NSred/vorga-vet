using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Patients;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Patients.GetById;

internal sealed class GetPatientByIdQueryHandler(IApplicationDbContext context, IUserContext userContext)
    : IQueryHandler<GetPatientByIdQuery, PatientDetailResponse>
{
    public async Task<Result<PatientDetailResponse>> Handle(
        GetPatientByIdQuery query,
        CancellationToken cancellationToken)
    {
        PatientDetailResponse? patient = await GetPatientDetailAsync(query.PatientId, cancellationToken);

        // A client asking about an animal that isn't theirs gets NotFound, not Forbidden,
        // so patient ids stay unprobeable.
        if (patient is null || !await IsVisibleToCallerAsync(patient.OwnerId, cancellationToken))
        {
            return Result.Failure<PatientDetailResponse>(PatientErrors.NotFound(query.PatientId));
        }

        patient.Allergies = await GetAllergiesAsync(query.PatientId, cancellationToken);

        return patient;
    }

    private async Task<bool> IsVisibleToCallerAsync(Guid patientOwnerId, CancellationToken cancellationToken)
    {
        if (userContext.Role != Role.Client)
        {
            return true;
        }

        Guid userId = userContext.UserId;

        return await context.Owners.AnyAsync(o => o.Id == patientOwnerId && o.UserId == userId, cancellationToken);
    }

    private Task<PatientDetailResponse?> GetPatientDetailAsync(Guid patientId, CancellationToken cancellationToken) =>
        (from p in context.Patients.AsNoTracking()
         where p.Id == patientId
         join owner in context.Owners.AsNoTracking() on p.OwnerId equals owner.Id
         join breed in context.Breeds.AsNoTracking() on p.BreedId equals breed.Id
         select new PatientDetailResponse
         {
             Id = p.Id,
             OwnerId = p.OwnerId,
             BreedId = p.BreedId,
             CardNumber = p.CardNumber,
             Name = p.Name,
             Species = breed.Species,
             BreedName = breed.Name,
             Sex = p.Sex,
             BirthDate = p.BirthDate,
             WeightKg = p.WeightKg,
             Color = p.Color,
             ChipNumber = p.ChipNumber,
             Anamnesis = p.Anamnesis,
             Note = p.Note,
             IsDeleted = p.IsDeleted,
             CreatedAt = p.CreatedAt,
             OwnerName = owner.FirstName + " " + owner.LastName,
             PhoneNumber = owner.PhoneNumber,
             Address = owner.Address,
             City = owner.City
         })
        .SingleOrDefaultAsync(cancellationToken);

    private Task<List<AllergenSummary>> GetAllergiesAsync(Guid patientId, CancellationToken cancellationToken) =>
        (from patientAllergen in context.PatientAllergens.AsNoTracking()
         join allergen in context.Allergens.AsNoTracking() on patientAllergen.AllergenId equals allergen.Id
         where patientAllergen.PatientId == patientId
         select new AllergenSummary(allergen.Id, allergen.Name))
        .ToListAsync(cancellationToken);
}
