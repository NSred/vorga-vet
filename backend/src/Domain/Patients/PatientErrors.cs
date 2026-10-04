using SharedKernel;

namespace Domain.Patients;

public static class PatientErrors
{
    public static Error NotFound(Guid patientId) => Error.NotFound(
        "Patients.NotFound",
        $"The patient with the Id = '{patientId}' was not found");

    public static readonly Error CardNumberNotUnique = Error.Conflict(
        "Patients.CardNumberNotUnique",
        "A patient with this card number already exists");

    public static Error AlreadyDeleted(Guid patientId) => Error.Problem(
        "Patients.AlreadyDeleted",
        $"The patient with the Id = '{patientId}' is already deleted");
}
