using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Patients.GetById;

internal sealed class GetPatientByIdQueryHandler(IApplicationDbContext context)
    : IQueryHandler<GetPatientByIdQuery, PatientDetailResponse>
{
    public async Task<Result<PatientDetailResponse>> Handle(
        GetPatientByIdQuery query,
        CancellationToken cancellationToken)
    {
        PatientDetailResponse? patient = await GetPatientDetailAsync(query.PatientId, cancellationToken);

        if (patient is null)
        {
            return Result.Failure<PatientDetailResponse>(PatientErrors.NotFound(query.PatientId));
        }

        patient.Allergies = await GetAllergiesAsync(query.PatientId, cancellationToken);

        return patient;
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
