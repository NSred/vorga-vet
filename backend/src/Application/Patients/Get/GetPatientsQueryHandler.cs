using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Breeds;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Patients.Get;

internal sealed class GetPatientsQueryHandler(IApplicationDbContext context)
    : IQueryHandler<GetPatientsQuery, GetPatientsResponse>
{
    private const int MaxPageSize = 100;

    public async Task<Result<GetPatientsResponse>> Handle(GetPatientsQuery query, CancellationToken cancellationToken)
    {
        int page = NormalizePage(query.Page);
        int pageSize = NormalizePageSize(query.PageSize);

        IQueryable<Patient> filtered = context.Patients.AsNoTracking();
        filtered = ApplyStatusFilter(filtered, query.Status);
        filtered = ApplySpeciesFilter(filtered, query.Species);
        filtered = ApplySexFilter(filtered, query.Sex);
        filtered = ApplyCityFilter(filtered, query.City);
        filtered = ApplyAllergenFilter(filtered, query.AllergenId);
        filtered = ApplySearchTermFilter(filtered, query.SearchTerm);

        int totalCount = await filtered.CountAsync(cancellationToken);

        IQueryable<Patient> pageOfPatients = filtered
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        List<PatientResponse> items = await ProjectToResponsesAsync(pageOfPatients, cancellationToken);

        await PopulateAllergiesAsync(items, cancellationToken);

        return new GetPatientsResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private static IQueryable<Patient> ApplyStatusFilter(IQueryable<Patient> query, PatientStatusFilter status) =>
        status switch
        {
            PatientStatusFilter.Active => query.Where(p => !p.IsDeleted),
            PatientStatusFilter.Deleted => query.Where(p => p.IsDeleted),
            _ => query
        };

    private IQueryable<Patient> ApplySpeciesFilter(IQueryable<Patient> query, Species? species) =>
        species is null
            ? query
            : query.Where(p => context.Breeds.Any(b => b.Id == p.BreedId && b.Species == species));

    private static IQueryable<Patient> ApplySexFilter(IQueryable<Patient> query, Sex? sex) =>
        sex is null ? query : query.Where(p => p.Sex == sex);

    private IQueryable<Patient> ApplyCityFilter(IQueryable<Patient> query, string? city) =>
        string.IsNullOrWhiteSpace(city)
            ? query
            : query.Where(p => context.Owners.Any(o => o.Id == p.OwnerId && o.City == city));

    private IQueryable<Patient> ApplyAllergenFilter(IQueryable<Patient> query, Guid? allergenId) =>
        allergenId is null
            ? query
            : query.Where(p => context.PatientAllergens.Any(pa => pa.PatientId == p.Id && pa.AllergenId == allergenId));

    private IQueryable<Patient> ApplySearchTermFilter(IQueryable<Patient> query, string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        string term = searchTerm.Trim();

        return query.Where(p =>
            EF.Functions.ILike(p.Name, $"%{term}%") ||
            p.ChipNumber != null && EF.Functions.ILike(p.ChipNumber, $"%{term}%") ||
            p.Anamnesis != null && EF.Functions.ILike(p.Anamnesis, $"%{term}%") ||
            context.Owners.Any(o => o.Id == p.OwnerId &&
                (EF.Functions.ILike(o.FirstName, $"%{term}%") ||
                 EF.Functions.ILike(o.LastName, $"%{term}%") ||
                 EF.Functions.ILike(o.PhoneNumber, $"%{term}%") ||
                 EF.Functions.ILike(o.Address, $"%{term}%"))) ||
            context.Breeds.Any(b => b.Id == p.BreedId && EF.Functions.ILike(b.Name, $"%{term}%")));
    }

    private Task<List<PatientResponse>> ProjectToResponsesAsync(
        IQueryable<Patient> pageOfPatients, CancellationToken cancellationToken) =>
        (from patient in pageOfPatients
         join owner in context.Owners.AsNoTracking() on patient.OwnerId equals owner.Id
         join breed in context.Breeds.AsNoTracking() on patient.BreedId equals breed.Id
         orderby patient.Name
         select new PatientResponse
         {
             Id = patient.Id,
             CardNumber = patient.CardNumber,
             Name = patient.Name,
             Species = breed.Species,
             BreedName = breed.Name,
             Sex = patient.Sex,
             BirthDate = patient.BirthDate,
             WeightKg = patient.WeightKg,
             Color = patient.Color,
             ChipNumber = patient.ChipNumber,
             IsDeleted = patient.IsDeleted,
             OwnerName = owner.FirstName + " " + owner.LastName,
             PhoneNumber = owner.PhoneNumber,
             Address = owner.Address,
             City = owner.City
         })
        .ToListAsync(cancellationToken);

    private async Task PopulateAllergiesAsync(List<PatientResponse> items, CancellationToken cancellationToken)
    {
        var patientIds = items.Select(i => i.Id).ToList();

        var allergenRows = await (
            from patientAllergen in context.PatientAllergens.AsNoTracking()
            join allergen in context.Allergens.AsNoTracking() on patientAllergen.AllergenId equals allergen.Id
            where patientIds.Contains(patientAllergen.PatientId)
            select new { patientAllergen.PatientId, allergen.Name })
            .ToListAsync(cancellationToken);

        ILookup<Guid, string> allergyNamesByPatientId = allergenRows.ToLookup(x => x.PatientId, x => x.Name);

        foreach (PatientResponse item in items)
        {
            item.Allergies = [.. allergyNamesByPatientId[item.Id]];
        }
    }

    private static int NormalizePage(int page) => page < 1 ? 1 : page;

    private static int NormalizePageSize(int pageSize) => pageSize is < 1 or > MaxPageSize ? 10 : pageSize;
}
