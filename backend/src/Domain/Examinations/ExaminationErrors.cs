using SharedKernel;

namespace Domain.Examinations;

public static class ExaminationErrors
{
    public static Error NotFound(Guid examinationId) => Error.NotFound(
        "Examinations.NotFound",
        $"The examination with the Id = '{examinationId}' was not found");

    public static readonly Error AlreadyPaid = Error.Problem(
        "Examinations.AlreadyPaid",
        "This examination has already been marked as paid");

    public static readonly Error AppointmentAlreadyHasExamination = Error.Conflict(
        "Examinations.AppointmentAlreadyHasExamination",
        "An examination has already been recorded for this appointment");
}
