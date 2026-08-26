using Application.Abstractions.Messaging;
using Domain.Breeds;
using Domain.Patients;

namespace Application.Patients.Get;

public sealed record GetPatientsQuery(
    string? SearchTerm,
    Species? Species,
    Sex? Sex,
    Guid? AllergenId,
    string? City,
    PatientStatusFilter Status,
    int Page,
    int PageSize) : IQuery<GetPatientsResponse>;
