using Domain.Patients;

namespace Application.Appointments.Resolution;

/// <summary>
/// How the vet identifies the owner at the visit for a booking that has none yet:
/// an existing record found by search, or the details for a new one. Exactly one.
/// </summary>
public sealed record OwnerResolution(Guid? ExistingOwnerId, NewOwnerDetails? Create);

public sealed record NewOwnerDetails(
    string FirstName,
    string LastName,
    string PhoneNumber,
    string Address,
    string City,
    string? Email);

/// <summary>
/// How the vet identifies the animal at the visit for a booking that has none yet.
/// Exactly one of the two. The new card is created under the resolved owner.
/// </summary>
public sealed record PatientResolution(Guid? ExistingPatientId, NewPatientDetails? Create);

public sealed record NewPatientDetails(
    Guid BreedId,
    string CardNumber,
    string Name,
    Sex Sex,
    DateTime? BirthDate,
    string? Color,
    string? ChipNumber,
    string? Note);

public sealed record ResolvedParties(Guid OwnerId, Guid PatientId);
